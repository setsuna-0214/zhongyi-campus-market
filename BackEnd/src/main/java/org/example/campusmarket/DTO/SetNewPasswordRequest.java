package org.example.campusmarket.DTO;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SetNewPasswordRequest {
    @NotBlank
    private String oldPassword;
    @NotBlank
    private String newPassword;
    private String confirmPassword;
    @NotBlank
    private String verificationCode;
}
