import Swal from 'sweetalert2';

export class ErrorHandlerService {
  /**
   * Formats validation errors from the backend and displays them in a SweetAlert
   * @param error The HTTP error response from the backend
   * @param defaultMessage Default message to show if no validation errors are found
   */
  static handleValidationError(error: any, defaultMessage: string = 'An error occurred'): void {
    if (error.error && typeof error.error === 'object') {
      const errors = error.error;
      const errorMessages: string[] = [];

      // Iterate through all error fields
      Object.keys(errors).forEach(key => {
        const fieldErrors = errors[key];
        const fieldName = this.formatFieldName(key);

        if (Array.isArray(fieldErrors)) {
          // If it's an array of errors, add each one with the field name
          fieldErrors.forEach(msg => {
            errorMessages.push(`<strong>${fieldName}:</strong> ${msg}`);
          });
        } else if (typeof fieldErrors === 'string') {
          // If it's a single string error
          errorMessages.push(`<strong>${fieldName}:</strong> ${fieldErrors}`);
        } else if (typeof fieldErrors === 'object') {
          // If it's a nested object, stringify it
          errorMessages.push(`<strong>${fieldName}:</strong> ${JSON.stringify(fieldErrors)}`);
        }
      });

      if (errorMessages.length > 0) {
        Swal.fire({
          title: 'Validation Error',
          html: errorMessages.join('<br>'),
          icon: 'error',
          confirmButtonColor: '#d33'
        });
      } else {
        // No structured errors found, show default message
        Swal.fire('Error', defaultMessage, 'error');
      }
    } else if (error.message) {
      // Show error message if available
      Swal.fire('Error', error.message, 'error');
    } else {
      // Fallback to default message
      Swal.fire('Error', defaultMessage, 'error');
    }
  }

  /**
   * Formats field names from snake_case to Title Case
   * @param fieldName The field name to format (e.g., "link_django")
   * @returns Formatted field name (e.g., "Link Django")
   */
  private static formatFieldName(fieldName: string): string {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
