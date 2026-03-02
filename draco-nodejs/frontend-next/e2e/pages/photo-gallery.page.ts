import type { Locator, Page } from '@playwright/test';

export class PhotoGalleryPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly allPhotosFilter: Locator;
  readonly manageAlbumsButton: Locator;
  readonly addPhotoFab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Photo Gallery Management' });
    this.subtitle = page.getByText('Upload photos, organize albums');
    this.allPhotosFilter = page.getByRole('button', { name: /All Photos/i });
    this.manageAlbumsButton = page.getByRole('button', { name: /Manage Albums/i });
    this.addPhotoFab = page.getByRole('button', { name: /add photo/i });
  }

  async goto(accountId: string) {
    await this.page.goto(`/account/${accountId}/photo-gallery/admin`);
    await this.heading.waitFor();
  }
}
