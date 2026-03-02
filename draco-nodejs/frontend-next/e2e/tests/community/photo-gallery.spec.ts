import { test, expect } from '../../fixtures/base-fixtures';
import { PhotoGalleryPage } from '../../pages/photo-gallery.page';

test.describe('Photo Gallery', () => {
  let galleryPage: PhotoGalleryPage;

  test.beforeEach(async ({ page, accountId }) => {
    galleryPage = new PhotoGalleryPage(page);
    await galleryPage.goto(accountId);
  });

  test('photo gallery admin page loads', async () => {
    await expect(galleryPage.heading).toBeVisible();
    await expect(galleryPage.subtitle).toBeVisible();
  });

  test('gallery section displays with album filters', async () => {
    await expect(galleryPage.allPhotosFilter).toBeVisible();
  });

  test('can open album manager dialog', async () => {
    await galleryPage.manageAlbumsButton.click();
    const dialog = galleryPage.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });

  test('album manager dialog can be closed', async () => {
    await galleryPage.manageAlbumsButton.click();
    const dialog = galleryPage.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await galleryPage.page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('add photo button is visible', async () => {
    await expect(galleryPage.addPhotoFab).toBeVisible();
  });

  test('can open photo admin dialog', async () => {
    await galleryPage.addPhotoFab.click();
    const dialog = galleryPage.page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });
});
