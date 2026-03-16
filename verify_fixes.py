from playwright.sync_api import sync_playwright
import time

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        page.on("dialog", lambda dialog: dialog.accept())

        # 1. Navigate to the app
        page.goto("http://localhost:3000/")
        page.wait_for_selector("text=Net Worth")

        # 2. Go to Expenses Tab
        page.locator("button:has-text('Expenses')").first.click()
        page.wait_for_selector("text=Overview")
        time.sleep(1)

        # 3. Go to Yearly View
        page.locator("button:has-text('Yearly View')").click()
        time.sleep(1)

        # Test preserving text state on tab switch
        page.fill("textarea[placeholder*='e.g.']", "Draft imported text here")
        time.sleep(1)
        page.screenshot(path="verification_text_before.png")

        # Switch to Income tab
        page.locator("button:has-text('Income')").first.click()
        time.sleep(1)

        # Switch back to Expenses Tab
        page.locator("button:has-text('Expenses')").first.click()
        time.sleep(1)

        # Assert text is still there
        textarea_val = page.locator("textarea[placeholder*='e.g.']").input_value()
        assert textarea_val == "Draft imported text here", f"Expected 'Draft imported text here', got '{textarea_val}'"

        page.screenshot(path="verification_text_after.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    verify_changes()
