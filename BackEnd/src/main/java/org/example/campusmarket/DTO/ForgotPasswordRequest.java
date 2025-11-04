package org.example.campusmarket.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ForgotPasswordRequest {
    @NotBlank @Email String email;
    @NotBlank String verificationCode;
    @NotBlank String newPassword;
    String confirmPassword;
}
