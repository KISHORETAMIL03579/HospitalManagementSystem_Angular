using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Domain.Entities;

namespace HospitalManagement.Application.Auth.Services;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RegisterAsync(RegisterUserRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<UserDto?> GetCurrentUserAsync(int userId, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest request, CancellationToken cancellationToken = default);
    Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);
    Task<IEnumerable<RoleDto>> GetRolesAsync(CancellationToken cancellationToken = default);

    // Workflow 1: Forgot Password & Email Reset Token
    Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
}
