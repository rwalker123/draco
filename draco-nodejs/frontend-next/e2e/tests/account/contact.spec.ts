import { test, expect } from '../../fixtures/base-fixtures';
import { ContactPage } from '../../pages/contact.page';

test.describe('Contact Page', () => {
  let contactPage: ContactPage;

  test.beforeEach(async ({ page }) => {
    contactPage = new ContactPage(page);
    await contactPage.goto();
  });

  test('loads with heading', async () => {
    await expect(contactPage.heading).toBeVisible();
  });

  test('contact form fields are visible', async () => {
    await expect(contactPage.nameField).toBeVisible();
    await expect(contactPage.emailField).toBeVisible();
    await expect(contactPage.subjectField).toBeVisible();
    await expect(contactPage.messageField).toBeVisible();
    await expect(contactPage.submitButton).toBeVisible();
  });

  test('form validation prevents empty submission', async () => {
    await contactPage.submitButton.click();
    const successAlert = contactPage.page.getByText('Thank you for your message');
    await expect(successAlert).not.toBeVisible();
    await expect(contactPage.heading).toBeVisible();
  });
});
