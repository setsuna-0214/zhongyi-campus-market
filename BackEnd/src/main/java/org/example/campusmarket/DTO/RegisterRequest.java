package org.example.campusmarket.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class RegisterRequest {
    @NotBlank String username;
    @Email @NotBlank private String email;
    @NotBlank String password;
    private String confirmPassword;
    @NotBlank String verificationCode;
}
