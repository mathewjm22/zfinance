from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to the Overview tab
        page.goto("http://localhost:3000/")
        page.wait_for_selector("text=Est. Annual Expenses")

        # Take screenshot of the Overview tab
        page.screenshot(path="verification_overview.png")

        # Go to the F.I.R.E. tab
        page.get_by_role("button", name="F.I.R.E.").click()
        page.wait_for_selector("text=FIRE Progress")

        # Take screenshot of the F.I.R.E. tab
        page.screenshot(path="verification_fire.png")

        # Go to the Retirement Analysis tab
        page.get_by_role("button", name="Retirement Analysis").click()
        page.wait_for_selector("text=Monte Carlo / Deterministic Projection")

        # Take screenshot of the Retirement Analysis tab
        page.screenshot(path="verification_analysis.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
