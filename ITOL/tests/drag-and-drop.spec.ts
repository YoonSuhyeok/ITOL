import { test, expect } from '@playwright/test';

test.describe('File Explorer Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Tauri API before page loads
    await page.addInitScript(() => {
      // Mock data
      const mockBooks = [
        { id: 1, title: "Default", parent_id: null },
        { id: 2, title: "ddd", parent_id: null }
      ];
      
      const mockPages = [
        { id: 1, fk_book_id: 1, title: "ffff", flow_data: null },
        { id: 2, fk_book_id: 1, title: "dd", flow_data: null }
      ];
      
      // Create mock invoke function
      const mockInvoke = async (command: string, args?: any) => {
        console.log('Mock invoke:', command, args);
        
        if (command === 'get_all_books_command') {
          return mockBooks;
        }
        if (command === 'get_pages_by_book_id_command') {
          return mockPages.filter((p: any) => p.fk_book_id === args.bookId);
        }
        if (command === 'update_page_command') {
          console.log('Updating page:', args);
          const page = mockPages.find((p: any) => p.id === args.id);
          if (page) {
            page.fk_book_id = args.fkBookId;
            page.title = args.title;
            page.flow_data = args.flowData;
            console.log('Page updated:', page);
          }
          return;
        }
        if (command === 'update_book_command') {
          console.log('Updating book:', args);
          const book = mockBooks.find((b: any) => b.id === args.id);
          if (book) {
            book.title = args.title;
            book.parent_id = args.parentId;
            console.log('Book updated:', book);
          }
          return;
        }
        
        console.log('Unknown command:', command);
        return null;
      };
      
      // Override @tauri-apps/api/core module
      if (!window.__TAURI_INTERNALS__) {
        (window as any).__TAURI_INTERNALS__ = {};
      }
      
      // Mock the core module
      (window as any).__TAURI_INVOKE__ = mockInvoke;
      
      // Also set __TAURI__ for compatibility
      (window as any).__TAURI__ = {
        core: {
          invoke: mockInvoke
        },
        tauri: {
          invoke: mockInvoke
        }
      };
      
      console.log('Mock Tauri injected');
    });
    
    // Intercept module loading to mock @tauri-apps/api/core
    await page.route('**/@tauri-apps/api/core', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          export const invoke = window.__TAURI_INVOKE__;
        `
      });
    });

    // Navigate to the app
    await page.goto('http://localhost:1420');
    
    // Wait for the app to load
    await page.waitForTimeout(2000);
  });

  test('should display files and folders', async ({ page }) => {
    // Check if Explorer is visible
    await expect(page.getByRole('heading', { name: 'Explorer' })).toBeVisible();
    
    // Check if the folder "ddd" is visible
    await expect(page.locator('text=ddd')).toBeVisible();
    
    // Check if pages "ffff" and "dd" are visible
    await expect(page.locator('text=ffff')).toBeVisible();
    await expect(page.locator('text=dd')).toBeVisible();
  });

  test('should show drag start console logs', async ({ page }) => {
    // Listen to console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    // Find and drag a page
    const pageElement = page.locator('#file-item-page-1');
    await expect(pageElement).toBeVisible();
    
    // Start dragging
    await pageElement.hover();
    await page.mouse.down();
    await page.waitForTimeout(500);
    
    // Check if drag start was logged
    const dragStartLog = consoleMessages.find(msg => msg.includes('Drag start: page-1'));
    expect(dragStartLog).toBeTruthy();
    
    await page.mouse.up();
  });

  test('should drag page to folder', async ({ page }) => {
    // Listen to console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
      console.log('Browser console:', msg.text());
    });

    // Wait for elements to be ready
    await page.waitForTimeout(1000);

    // Find source (page) and target (folder)
    const sourcePage = page.locator('#file-item-page-1');
    const targetFolder = page.locator('#file-item-book-2');
    
    await expect(sourcePage).toBeVisible();
    await expect(targetFolder).toBeVisible();

    // Get bounding boxes
    const sourceBox = await sourcePage.boundingBox();
    const targetBox = await targetFolder.boundingBox();
    
    if (!sourceBox || !targetBox) {
      throw new Error('Could not get bounding boxes');
    }

    console.log('Source box:', sourceBox);
    console.log('Target box:', targetBox);

    // Perform drag and drop
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(500);
    
    console.log('Mouse down at source');
    
    // Move to target (center for "inside" drop)
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
    await page.waitForTimeout(500);
    
    console.log('Mouse moved to target');
    
    // Drop
    await page.mouse.up();
    await page.waitForTimeout(500);
    
    console.log('Mouse up at target');

    // Check console logs
    console.log('All console messages:', consoleMessages);
    
    const dragStartLog = consoleMessages.find(msg => msg.includes('Drag start: page-1'));
    const dropLog = consoleMessages.find(msg => msg.includes('Drop:'));
    
    console.log('Drag start log:', dragStartLog);
    console.log('Drop log:', dropLog);
    
    // Verify drag started
    expect(dragStartLog).toBeTruthy();
    
    // Verify drop occurred
    if (!dropLog) {
      console.error('Drop event did not fire!');
      // Take screenshot for debugging
      await page.screenshot({ path: 'drag-drop-failure.png' });
    }
    
    expect(dropLog).toBeTruthy();
    expect(dropLog).toContain('page-1');
    expect(dropLog).toContain('book-2');
  });

  test('should drag page between pages', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.waitForTimeout(1000);

    const sourcePage = page.locator('#file-item-page-1');
    const targetPage = page.locator('#file-item-page-2');
    
    await expect(sourcePage).toBeVisible();
    await expect(targetPage).toBeVisible();

    const sourceBox = await sourcePage.boundingBox();
    const targetBox = await targetPage.boundingBox();
    
    if (!sourceBox || !targetBox) {
      throw new Error('Could not get bounding boxes');
    }

    // Drag from page-1 to page-2
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(300);
    
    // Move to target (above for "before" drop)
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 5, { steps: 10 });
    await page.waitForTimeout(300);
    
    await page.mouse.up();
    await page.waitForTimeout(500);

    const dropLog = consoleMessages.find(msg => msg.includes('Drop:') && msg.includes('page-1'));
    
    console.log('All console messages:', consoleMessages);
    console.log('Drop log:', dropLog);
    
    expect(dropLog).toBeTruthy();
  });

  test('should drag folder', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.waitForTimeout(1000);

    const sourceFolder = page.locator('#file-item-book-2');
    
    await expect(sourceFolder).toBeVisible();

    const sourceBox = await sourceFolder.boundingBox();
    
    if (!sourceBox) {
      throw new Error('Could not get bounding box');
    }

    // Try to drag folder
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(500);
    
    const dragStartLog = consoleMessages.find(msg => msg.includes('Drag start: book-2'));
    
    console.log('Drag start log:', dragStartLog);
    
    await page.mouse.up();
    
    expect(dragStartLog).toBeTruthy();
    expect(dragStartLog).toContain('BOOK');
  });
});
