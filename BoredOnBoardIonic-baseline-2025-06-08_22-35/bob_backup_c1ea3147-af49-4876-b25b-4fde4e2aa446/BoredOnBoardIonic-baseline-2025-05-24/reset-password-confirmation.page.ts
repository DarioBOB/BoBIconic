import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Auth, confirmPasswordReset, verifyPasswordResetCode } from '@angular/fire/auth';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { isPasswordValid, doPasswordsMatch } from '../../core/shared/password.utils';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-reset-password-confirmation',
  templateUrl: './reset-password-confirmation.page.html',
  styleUrls: ['./reset-password-confirmation.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, TranslatePipe, HttpClientModule]
})
export class ResetPasswordConfirmationPage implements OnInit {
  email = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  oobCode: string | null = null;

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit() {
    // Récupérer le code de réinitialisation depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    this.oobCode = urlParams.get('oobCode');
    
    if (this.oobCode) {
      this.verifyResetCode();
    }
  }

  private async verifyResetCode() {
    try {
      const email = await verifyPasswordResetCode(this.auth, this.oobCode!);
      this.email = email;
    } catch (error) {
      this.errorMessage = 'AUTH.ERRORS.INVALID_RESET_CODE';
      setTimeout(() => {
        this.router.navigate(['/auth/email']);
      }, 3000);
    }
  }

  async resetPassword() {
    if (!this.oobCode) {
      this.errorMessage = 'AUTH.ERRORS.INVALID_RESET_CODE';
      return;
    }

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'AUTH.ERRORS.EMPTY_FIELDS';
      return;
    }

    if (!doPasswordsMatch(this.newPassword, this.confirmPassword)) {
      this.errorMessage = 'AUTH.ERRORS.PASSWORDS_DONT_MATCH';
      return;
    }

    if (!isPasswordValid(this.newPassword)) {
      this.errorMessage = 'AUTH.ERRORS.PASSWORD_REQUIREMENTS';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await confirmPasswordReset(this.auth, this.oobCode, this.newPassword);
      this.successMessage = 'AUTH.RESET_SUCCESS';
      setTimeout(() => {
        this.router.navigate(['/auth/email']);
      }, 3000);
    } catch (error: any) {
      switch (error.code) {
        case 'auth/expired-action-code':
          this.errorMessage = 'AUTH.ERRORS.EXPIRED_RESET_CODE';
          break;
        case 'auth/invalid-action-code':
          this.errorMessage = 'AUTH.ERRORS.INVALID_RESET_CODE';
          break;
        case 'auth/weak-password':
          this.errorMessage = 'AUTH.ERRORS.WEAK_PASSWORD';
          break;
        default:
          this.errorMessage = 'AUTH.ERRORS.UNKNOWN';
      }
    } finally {
      this.isLoading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
} 