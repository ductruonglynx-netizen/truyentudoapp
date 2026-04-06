import { expect, test } from '@playwright/test';

test.describe('TruyenForge stability smoke', () => {
  test('loads homepage and navbar core actions', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('TruyenForge').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Trang chủ|Tủ truyện/i }).first(),
    ).toBeVisible();

    // App có 2 mode: Đọc / Studio.
    // Nếu đang ở Đọc thì chưa có API/Công cụ trong navbar -> chuyển qua Studio rồi mới assert.
    const apiButton = page.getByRole('button', { name: /^API$/i });
    if ((await apiButton.count()) === 0) {
      const studioSwitch = page.getByRole('button', { name: /^Studio$|^Chế độ studio$/i }).first();
      await expect(studioSwitch).toBeVisible();
      await studioSwitch.click();
    }

    await expect(page.getByRole('button', { name: /^API$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Công cụ/i })).toBeVisible();
  });

  test('opens backup center from profile menu', async ({ page }) => {
    await page.goto('/');

    await page.getByTitle('Tài khoản').first().click();
    await page.getByRole('button', { name: /Sao lưu & khôi phục/i }).first().click();

    await expect(page.getByRole('heading', { name: /Sao lưu và khôi phục dữ liệu/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sao lưu ngay/i })).toBeVisible();
  });
});
