from playwright.sync_api import sync_playwright
import time

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Handle dialogs automatically to avoid blocking
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
        page.screenshot(path="verification_debug2.png")
        
        page.wait_for_selector("text=Retirement Expense Projections")
        page.screenshot(path="verification_yearly_view.png", full_page=True)

        # 5. Go to FIRE Tab
        page.locator("button:has-text('F.I.R.E.')").first.click()
        page.wait_for_selector("text=Estimated Retirement Expenses")
        time.sleep(1)
        
        # 6. Take a screenshot of the FIRE Tab
        page.screenshot(path="verification_fire_tab.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    verify_changes()