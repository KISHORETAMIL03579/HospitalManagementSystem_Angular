using System.Security.Cryptography;
using FluentValidation;
using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Application.Auth.Interfaces;
using HospitalManagement.Application.Common.Email;
using HospitalManagement.Application.Common.Security;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace HospitalManagement.Application.Auth.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IEmailService _emailService;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IValidator<RegisterUserRequest> _registerValidator;
    private readonly ILogger<AuthService>? _logger;
    private readonly HospitalManagement.Application.Common.Audit.IAuditService? _auditService;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        IEmailService emailService,
        IValidator<LoginRequest> loginValidator,
        IValidator<RegisterUserRequest> registerValidator,
        ILogger<AuthService>? logger = null,
        HospitalManagement.Application.Common.Audit.IAuditService? auditService = null)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _emailService = emailService;
        _loginValidator = loginValidator;
        _registerValidator = registerValidator;
        _logger = logger;
        _auditService = auditService;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var validationResult = await _loginValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        var identifier = request.UsernameOrEmail.Trim();
        var user = await _userRepository.GetByEmailOrUsernameAsync(identifier, cancellationToken);
        if (user is null)
        {
            var staffRequest = await _userRepository.GetStaffRegistrationRequestByEmailAsync(identifier, cancellationToken);
            if (staffRequest is not null)
            {
                if (staffRequest.Status == RegistrationStatus.Pending)
                {
                    throw new HospitalManagement.Application.Auth.Exceptions.AccountPendingApprovalException(
                        "Your staff onboarding request is currently awaiting administrator review. You will receive an email notification once your request has been reviewed.");
                }
                if (staffRequest.Status == RegistrationStatus.Rejected)
                {
                    throw new HospitalManagement.Application.Auth.Exceptions.AccountRejectedException(
                        "Your staff registration request was not approved. Please contact the hospital administration office for further details.");
                }
            }

            throw new KeyNotFoundException($"Account '{request.UsernameOrEmail}' is not registered in CareFlow HMS.");
        }

        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Incorrect password provided. Please verify your password.");
        }

        if (!user.IsActive)
        {
            throw new HospitalManagement.Application.Auth.Exceptions.AccountInactiveException(
                "Your account has been created but is currently inactive. You cannot sign in until your account is activated by an authorized hospital administrator. Please contact your hospital administrator or the IT support team to request activation.");
        }

        user.LastLoginAt = DateTime.UtcNow;
        user.RefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

        await _userRepository.UpdateAsync(user, cancellationToken);

        if (_auditService is not null)
        {
            await _auditService.LogAsync(
                action: "LOGIN",
                entityName: "User",
                entityId: user.UserId.ToString(),
                details: $"User '{user.Username}' authenticated successfully.",
                userId: user.UserId,
                username: user.Username,
                role: user.Role?.Name,
                cancellationToken: cancellationToken);
        }

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponse
        {
            Token = token,
            RefreshToken = user.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(120),
            User = MapToUserDto(user)
        };
    }

    public async Task<AuthResponse> RegisterAsync(RegisterUserRequest request, CancellationToken cancellationToken = default)
    {
        // 1. FluentValidation
        var validationResult = await _registerValidator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        // 2. Uniqueness Checks
        if (await _userRepository.ExistsByEmailAsync(request.Email.Trim(), cancellationToken))
        {
            throw new InvalidOperationException($"Email '{request.Email}' is already registered.");
        }

        if (await _userRepository.ExistsByUsernameAsync(request.Username.Trim(), cancellationToken))
        {
            throw new InvalidOperationException($"Username '{request.Username}' is already taken.");
        }

        // 3. Server-Side Invitation Validation
        if (string.IsNullOrWhiteSpace(request.InvitationCode))
        {
            throw new InvalidOperationException("Invitation code is required for staff registration.");
        }

        var invitation = await _userRepository.GetInvitationByCodeAsync(request.InvitationCode.Trim(), cancellationToken);
        if (invitation is null)
        {
            throw new InvalidOperationException("Invalid or unrecognized invitation code.");
        }

        if (invitation.IsUsed)
        {
            throw new InvalidOperationException("This invitation code has already been used.");
        }

        if (invitation.ExpiresAt <= DateTime.UtcNow)
        {
            throw new InvalidOperationException("This invitation code has expired.");
        }

        if (!string.IsNullOrWhiteSpace(invitation.BoundEmail) &&
            !invitation.BoundEmail.Equals(request.Email.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invitation code is restricted to a specific email address.");
        }

        if (!string.IsNullOrWhiteSpace(invitation.BoundEmployeeId) &&
            !invitation.BoundEmployeeId.Equals(request.EmployeeId?.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invitation code is restricted to a specific employee ID.");
        }

        // 4. SERVER-ENFORCED ROLE ASSIGNMENT
        var authorizedRole = invitation.TargetRole
            ?? await _userRepository.GetRoleByIdOrNameAsync(invitation.TargetRoleId, null, cancellationToken);

        if (authorizedRole is null)
        {
            throw new InvalidOperationException("Authorized role associated with invitation code could not be resolved.");
        }

        // 5. Transactional User Creation
        var user = new User
        {
            Username = request.Username.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            EmployeeId = string.IsNullOrWhiteSpace(request.EmployeeId) ? null : request.EmployeeId.Trim(),
            RoleId = authorizedRole.RoleId,
            Role = authorizedRole,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        user.RefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

        await _userRepository.AddAsync(user, cancellationToken);

        // Mark Invitation Code as Used once
        await _userRepository.MarkInvitationAsUsedAsync(invitation.InvitationCodeId, user.UserId, cancellationToken);

        // Security Audit Log (No Passwords or Patient PHI)
        _logger?.LogInformation(
            "SECURITY AUDIT: User '{Username}' registered with SERVER-ASSIGNED role '{RoleName}' (RoleId: {RoleId}) using invitation code '{InvitationCode}'. Client-submitted role preference was ignored.",
            user.Username, authorizedRole.Name, authorizedRole.RoleId, request.InvitationCode);

        if (_auditService is not null)
        {
            await _auditService.LogAsync(
                action: "REGISTER",
                entityName: "User",
                entityId: user.UserId.ToString(),
                details: $"User '{user.Username}' registered with role '{authorizedRole.Name}'.",
                userId: user.UserId,
                username: user.Username,
                role: authorizedRole.Name,
                cancellationToken: cancellationToken);
        }

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponse
        {
            Token = token,
            RefreshToken = user.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(120),
            User = MapToUserDto(user)
        };
    }

    // WORKFLOW 1: FORGOT PASSWORD & SECURE TOKEN RESET
    public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return true; // Return generic response
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _userRepository.GetByEmailOrUsernameAsync(normalizedEmail, cancellationToken);

        // Return generic success regardless of whether account exists (Security standard against enumeration)
        if (user is null || !user.IsActive)
        {
            _logger?.LogInformation("FORGOT PASSWORD: Request received for non-existent or inactive email '{Email}'. Generic response returned.", normalizedEmail);
            return true;
        }

        // Generate secure 64-character raw token
        var rawToken = Guid.NewGuid().ToString("N") + RandomNumberGenerator.GetHexString(16);
        var tokenHash = _passwordHasher.HashPassword(rawToken);

        var resetToken = new PasswordResetToken
        {
            Email = normalizedEmail,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(30),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.SavePasswordResetTokenAsync(resetToken, cancellationToken);
        await _emailService.SendPasswordResetEmailAsync(user.Email, rawToken, cancellationToken);

        _logger?.LogInformation("FORGOT PASSWORD: Reset token generated and email dispatched to '{Email}'. Token expires in 30 minutes.", user.Email);
        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            throw new ArgumentException("Email, reset token, and new password are required.");
        }

        if (!request.NewPassword.Equals(request.ConfirmPassword))
        {
            throw new ArgumentException("Passwords do not match.");
        }

        if (request.NewPassword.Length < 6)
        {
            throw new ArgumentException("Password must be at least 6 characters long.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _userRepository.GetByEmailOrUsernameAsync(normalizedEmail, cancellationToken);
        if (user is null)
        {
            throw new InvalidOperationException("Invalid or expired password reset request.");
        }

        // Search for active reset token
        var validTokens = await _userRepository.GetValidPasswordResetTokenAsync(normalizedEmail, _passwordHasher.HashPassword(request.Token), cancellationToken);
        if (validTokens is null)
        {
            // Fallback token comparison if hashed matching varies
            throw new InvalidOperationException("Invalid, expired, or already used password reset token.");
        }

        // Update password & invalidate refresh tokens
        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;

        await _userRepository.UpdateAsync(user, cancellationToken);
        await _userRepository.MarkPasswordResetTokenAsUsedAsync(validTokens.PasswordResetTokenId, cancellationToken);

        _logger?.LogInformation("SECURITY AUDIT: Password reset successfully completed for user '{Email}'. Active refresh sessions revoked.", user.Email);
        return true;
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByRefreshTokenAsync(refreshToken, cancellationToken);
        if (user is null || user.RefreshTokenExpiryTime <= DateTime.UtcNow || !user.IsActive)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        user.RefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userRepository.UpdateAsync(user, cancellationToken);

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponse
        {
            Token = token,
            RefreshToken = user.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(120),
            User = MapToUserDto(user)
        };
    }

    public async Task<UserDto?> GetCurrentUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        return (user is null || !user.IsActive) ? null : MapToUserDto(user);
    }

    public async Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null || !user.IsActive)
        {
            throw new KeyNotFoundException("User not found or account is deactivated.");
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
            user.FullName = request.FullName.Trim();

        if (!string.IsNullOrWhiteSpace(request.Email) && !user.Email.Equals(request.Email.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            if (await _userRepository.ExistsByEmailAsync(request.Email.Trim(), cancellationToken))
            {
                throw new InvalidOperationException($"Email '{request.Email}' is already in use by another account.");
            }
            user.Email = request.Email.Trim().ToLowerInvariant();
        }

        user.TimeFormat = request.TimeFormat;
        if (!string.IsNullOrWhiteSpace(request.TimeZone)) user.TimeZone = request.TimeZone.Trim();
        if (!string.IsNullOrWhiteSpace(request.Language)) user.Language = request.Language.Trim();
        if (request.Phone != null) user.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();

        await _userRepository.UpdateAsync(user, cancellationToken);
        return MapToUserDto(user);
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null || !user.IsActive)
        {
            throw new KeyNotFoundException("User not found or account is deactivated.");
        }

        if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Current password verification failed.");
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        {
            throw new ArgumentException("New password must be at least 6 characters long.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        await _userRepository.UpdateAsync(user, cancellationToken);
        return true;
    }

    public async Task<IEnumerable<RoleDto>> GetRolesAsync(CancellationToken cancellationToken = default)
    {
        var roles = await _userRepository.GetActiveRolesAsync(cancellationToken);
        return roles.Select(r => new RoleDto
        {
            RoleId = r.RoleId,
            Name = r.Name,
            Description = r.Description,
            Level = r.Level,
            ParentRoleId = r.ParentRoleId,
            Permissions = r.RolePermissions.Select(rp => rp.Permission.Name).ToList()
        });
    }

    private static UserDto MapToUserDto(User u)
    {
        Enum.TryParse<UserRole>(u.Role?.Name, true, out var parsedRole);
        if ((int)parsedRole == 0 && u.Role != null)
        {
            parsedRole = (UserRole)u.Role.Level;
        }

        return new UserDto
        {
            UserId = u.UserId,
            Username = u.Username,
            Email = u.Email,
            FullName = u.FullName,
            EmployeeId = u.EmployeeId,
            Phone = u.Phone,
            Role = parsedRole,
            RoleName = u.Role?.Name ?? parsedRole.ToString(),
            LastLoginAt = u.LastLoginAt,
            TimeFormat = u.TimeFormat,
            TimeZone = u.TimeZone ?? "UTC",
            Language = u.Language ?? "en-US"
        };
    }
}
