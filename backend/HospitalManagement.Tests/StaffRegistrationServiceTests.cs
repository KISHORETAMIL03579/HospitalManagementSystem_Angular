using HospitalManagement.Application.Auth.DTOs;
using HospitalManagement.Application.Auth.Interfaces;
using HospitalManagement.Application.Common.Email;
using HospitalManagement.Application.Common.Security;
using HospitalManagement.Application.StaffRegistration.Services;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Domain.Enums;
using HospitalManagement.Infrastructure.Security;
using Moq;
using Xunit;

namespace HospitalManagement.Tests;

public class StaffRegistrationServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly IPasswordHasher _passwordHasher;
    private readonly StaffRegistrationService _staffRegistrationService;

    public StaffRegistrationServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _emailServiceMock = new Mock<IEmailService>();
        _passwordHasher = new PasswordHasher();

        _staffRegistrationService = new StaffRegistrationService(
            _userRepositoryMock.Object,
            _passwordHasher,
            _emailServiceMock.Object);
    }

    [Fact]
    public async Task SubmitStaffRegistrationRequestAsync_WithValidInvitation_ShouldCreatePendingRequest()
    {
        var request = new SubmitStaffRegistrationRequest
        {
            FullName = "Dr. Sarah Jenkins",
            Email = "sarah.jenkins@hospital.com",
            Username = "sjenkins",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            InvitationCode = "DOC-CARDIO"
        };

        var docRole = new Role { RoleId = 2, Name = "Doctor", Level = 80 };
        var validInvitation = new InvitationCode { InvitationCodeId = 5, Code = "DOC-CARDIO", TargetRoleId = 2, TargetRole = docRole, ExpiresAt = DateTime.UtcNow.AddDays(10), IsUsed = false };

        _userRepositoryMock.Setup(r => r.GetInvitationByCodeAsync("DOC-CARDIO", It.IsAny<CancellationToken>())).ReturnsAsync(validInvitation);

        StaffRegistrationRequest? capturedReq = null;
        _userRepositoryMock.Setup(r => r.AddStaffRegistrationRequestAsync(It.IsAny<StaffRegistrationRequest>(), It.IsAny<CancellationToken>()))
            .Callback<StaffRegistrationRequest, CancellationToken>((s, ct) => capturedReq = s)
            .ReturnsAsync((StaffRegistrationRequest s, CancellationToken ct) => s);

        var result = await _staffRegistrationService.SubmitStaffRegistrationRequestAsync(request);

        Assert.NotNull(result);
        Assert.NotNull(capturedReq);
        Assert.Equal(RegistrationStatus.Pending, capturedReq.Status);
        Assert.Equal("sarah.jenkins@hospital.com", capturedReq.Email);
        _emailServiceMock.Verify(e => e.SendRegistrationConfirmationEmailAsync("sarah.jenkins@hospital.com", "Dr. Sarah Jenkins", It.IsAny<int?>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ApproveStaffRegistrationRequestAsync_WhenRequestNotFound_ShouldThrowKeyNotFoundException()
    {
        _userRepositoryMock.Setup(r => r.GetStaffRegistrationRequestByIdAsync(999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((StaffRegistrationRequest?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _staffRegistrationService.ApproveStaffRegistrationRequestAsync(999, 1, new ApproveStaffRequest()));
    }
}

