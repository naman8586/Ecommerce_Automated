import re
import time
import json
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager
import logging

# Configure logging
logging.basicConfig(filename="amazon_scraper.log", level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Global scraping configurations
retries = 2
search_page = 2  # Adjust to desired number of pages
search_keyword = "Louis vuitton bag"

# Setup Selenium configurations
options = webdriver.ChromeOptions()
options.add_argument("--ignore-certificate-errors")
options.add_argument("--log-level=3")
# options.add_argument("--headless")  # Uncomment for headless mode
browser = webdriver.Chrome(service=webdriver.chrome.service.Service(ChromeDriverManager().install()), options=options)
browser.maximize_window()

def retry_extraction(func, attempts=3, delay=1, default=""):
    """
    Helper function that retries an extraction function up to 'attempts' times.
    Returns the result if successful, otherwise returns 'default'.
    """
    for i in range(attempts):
        try:
            result = func()
            if result:
                return result
        except Exception as e:
            logging.warning(f"Retry {i+1}/{attempts} failed: {e}")
            time.sleep(delay)
    return default

def clean_text(text):
    """
    Clean text by removing extra whitespace, newlines, control characters, and special Unicode characters.
    """
    if not text:
        return ""
    # Remove control characters, including U+200F (RTL), U+200E (LTR), and others
    cleaned = re.sub(r'[\u2000-\u200F\u2028-\u202F]+', '', text)
    # Replace multiple spaces, newlines, or tabs with a single space
    cleaned = re.sub(r'\s+', ' ', cleaned)
    # Remove literal [U+200F] or similar escape sequences
    cleaned = re.sub(r'\[U\+[0-9A-Fa-f]+\]', '', cleaned)
    return cleaned.strip()

def extract_product_description(product_page_html, driver):
    """
    Extract product description from the product page, including overview, features, and technical specs.
    """
    description = {
        "features": [],
        "technical_specs": {}
    }

    # Extract features from module-9 sections
    try:
        module_9_sections = product_page_html.find_all("div", {"class": "aplus-module module-9"})
        for section in module_9_sections:
            flex_items = section.find_all("div", {"class": "apm-flex-item-third-width"})
            for item in flex_items:
                try:
                    heading = clean_text(item.find("h4").get_text(strip=True))
                    paragraphs = item.find_all("p")
                    lists = item.find_all("ul", {"class": "a-unordered-list"})
                    feature_text = f"{heading}\n"
                    for p in paragraphs:
                        p_text = clean_text(p.get_text(strip=True))
                        if p_text:
                            feature_text += f"{p_text}\n"
                    for ul in lists:
                        for li in ul.find_all("li"):
                            li_text = clean_text(li.get_text(strip=True))
                            feature_text += f"- {li_text}\n"
                    description["features"].append(feature_text.strip())
                except Exception as e:
                    logging.warning(f"Error extracting feature: {e}")
    except Exception as e:
        logging.warning(f"Error extracting module-9 sections: {e}")

    # Extract technical specifications from module-16-tech-specs
    try:
        tech_specs_table = product_page_html.find("table", {"class": "aplus-tech-spec-table"})
        if tech_specs_table:
            rows = tech_specs_table.find_all("tr")
            for row in rows:
                cells = row.find_all("td")
                if len(cells) == 2:
                    key = clean_text(cells[0].get_text(strip=True))
                    value = clean_text(cells[1].get_text(strip=True))
                    description["technical_specs"][key] = value
    except Exception as e:
        logging.warning(f"Error extracting technical specs: {e}")

    # Extract description from feature-bullets
    try:
        description_elements = WebDriverWait(driver, 10).until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, "#feature-bullets li.a-spacing-mini"))
        )
        if description_elements:
            feature_text = ""
            for element in description_elements:
                driver.execute_script("arguments[0].scrollIntoView(true);", element)
                time.sleep(0.5)
                element_text = clean_text(element.text.strip())
                feature_text += f"- {element_text}\n"
            description["features"].append(feature_text.strip())
    except TimeoutException:
        logging.warning("Primary description selector not found, trying alternative selector...")
        try:
            container_element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "ul.a-unordered-list.a-vertical.a-spacing-small"))
            )
            description_elements = container_element.find_elements(By.CSS_SELECTOR, "li")
            if description_elements:
                feature_text = ""
                for element in description_elements:
                    driver.execute_script("arguments[0].scrollIntoView(true);", element)
                    time.sleep(0.5)
                    element_text = clean_text(element.text.strip())
                    feature_text += f"- {element_text}\n"
                description["features"].append(feature_text.strip())
        except TimeoutException as e:
            logging.warning(f"Alternative description selector not found: {e}")

    return description

def scrape_amazon_products():
    scraped_products = {}  # Using URL as key to avoid duplicates
    for page in range(1, search_page + 1):
        for attempt in range(retries):
            try:
                search_url = f'https://www.amazon.in/s?k={search_keyword}&page={page}&xpid=cmkUTDSjFdfFO'
                browser.get(search_url)
                WebDriverWait(browser, 10).until(
                    lambda d: d.execute_script("return document.readyState") == "complete"
                )
                time.sleep(2)  # Allow dynamic content to load
                html_data = BeautifulSoup(browser.page_source, 'html.parser')
                product_cards_container = browser.find_element(By.XPATH, '//span[@data-component-type="s-search-results"]')
                if not product_cards_container:
                    logging.warning(f"No products found on page {page}")
                    print(f"No products found on page {page}")
                    break
                product_cards_html = BeautifulSoup(product_cards_container.get_attribute("outerHTML"), "html.parser")
                product_cards = product_cards_html.find_all("div", {"role": "listitem"})
                for product in product_cards:
                    product_json_data = {
                        "url": "N/A",
                        "title": "N/A",
                        "currency": "N/A",
                        "exact_price": "N/A",
                        "description": "N/A",
                        "min_order": "1 unit",
                        "supplier": "N/A",
                        "origin": "N/A",
                        "feedback": {"rating": "N/A", "review": "N/A"},
                        "image_url": "N/A",
                        "images": [],
                        "videos": [],
                        "Specifications": {},
                        "website_name": "Amazon",
                        "discount_information": "N/A",
                        "brand_name": "N/A"
                    }
                    

                    # Extract product URL
                    try:
                        product_link = retry_extraction(
                            lambda: product.find("a", {"class": "a-link-normal s-line-clamp-2 s-link-style a-text-normal"})["href"]
                        )
                        if product_link:
                            product_url = product_link if product_link.startswith("https://www.amazon.in") else f"https://www.amazon.in{product_link}"
                            product_json_data["url"] = product_url
                            logging.info(f"Product URL: {product_url}")
                            print(f"Product URL: {product_url}")
                    except Exception as e:
                        logging.warning(f"Error extracting product URL: {e}")
                        print(f"Error extracting product URL: {e}")

                    # Avoid duplicate products by URL
                    if product_json_data["url"] in scraped_products:
                        logging.info(f"Skipping duplicate product: {product_json_data['url']}")
                        continue

                    # Extract product title
                    try:
                        title_elem = retry_extraction(
                            lambda: product.find("a", {"class": "a-link-normal s-line-clamp-2 s-link-style a-text-normal"})
                        )
                        if title_elem:
                            product_json_data["title"] = clean_text(title_elem.get_text(strip=True))
                            logging.info(f"Product title: {product_json_data['title']}")
                            print(f"Product title: {product_json_data['title']}")
                    except Exception as e:
                        logging.warning(f"Error extracting product title: {e}")
                        print(f"Error extracting product title: {e}")

                    # Extract product currency
                    try:
                        product_currency_element = retry_extraction(
                            lambda: product.find("span", {"class": "a-price-symbol"})
                        )
                        if product_currency_element:
                            product_json_data["currency"] = clean_text(product_currency_element.get_text(strip=True))
                            logging.info(f"Product currency: {product_json_data['currency']}")
                            print(f"Product currency: {product_json_data['currency']}")
                    except Exception as e:
                        logging.warning(f"Error extracting product currency: {e}")
                        print(f"Error extracting product currency: {e}")

                    # Extract product price
                    try:
                        product_price_element = retry_extraction(
                            lambda: product.find("span", {"class": "a-price-whole"})
                        )
                        if product_price_element:
                            product_json_data["exact_price"] = clean_text(product_price_element.get_text(strip=True)).replace(",", "")
                            logging.info(f"Product price: {product_json_data['price']}")
                            print(f"Product price: {product_json_data['price']}")
                    except Exception as e:
                        logging.warning(f"Error extracting product price: {e}")
                        print(f"Error extracting product price: {e}")

                    # Open product page to extract additional details
                    if product_json_data["url"]:
                        try:
                            browser.execute_script("window.open('');")
                            browser.switch_to.window(browser.window_handles[-1])
                            browser.get(product_json_data["url"])
                            WebDriverWait(browser, 10).until(
                                lambda d: d.execute_script("return document.readyState") == "complete"
                            )
                            time.sleep(1)
                            product_page_html = BeautifulSoup(browser.page_source, "html.parser")

                            # Extract product description
                            product_json_data["description"] = extract_product_description(product_page_html, browser)

                            # Extract MRP
                            # try:
                            #     mrp_element = retry_extraction(
                            #         lambda: product_page_html.select_one("span.a-price.a-text-price span.a-offscreen")
                            #     )
                            #     if mrp_element:
                            #         mrp_text = clean_text(mrp_element.get_text(strip=True))
                            #         if mrp_text:
                            #             mrp_value = re.sub(r'[^\d.]', '', mrp_text)
                            #             product_json_data["MRP"] = float(mrp_value) if mrp_value else ""
                            #             logging.info(f"MRP extracted: {product_json_data['mrp']} for {product_json_data['url']}")
                            #             print(f"MRP extracted: {product_json_data['mrp']} for {product_json_data['url']}")
                            #         else:
                            #             logging.warning(f"No MRP text found for {product_json_data['url']}")
                            #             print(f"No MRP text found for {product_json_data['url']}")
                            #     else:
                            #         logging.warning(f"No MRP element found for {product_json_data['url']}")
                            #         print(f"No MRP element found for {product_json_data['url']}")
                            # except Exception as e:
                            #     logging.warning(f"Error extracting MRP for {product_json_data['url']}: {e}")
                            #     print(f"Error extracting MRP for {product_json_data['url']}: {e}")

                            # Extract discount information
                            try:
                                discount_elem = retry_extraction(
                                    lambda: product_page_html.select_one("span.savingsPercentage")
                                )
                                if discount_elem:
                                    product_json_data["discount_information"] = clean_text(discount_elem.get_text(strip=True))
                                    logging.info(f"Discount extracted: {product_json_data['discount_information']} for {product_json_data['url']}")
                                    print(f"Discount extracted: {product_json_data['discount_information']} for {product_json_data['url']}")
                                else:
                                    # Fallback: Calculate discount from MRP and price
                                    if product_json_data["mrp"] and product_json_data["price"]:
                                        try:
                                            current_price = float(re.sub(r'[^\d.]', '', product_json_data["price"]))
                                            mrp_value = float(product_json_data["mrp"])
                                            if mrp_value > current_price:
                                                discount_percentage = ((mrp_value - current_price) / mrp_value) * 100
                                                product_json_data["discount_information"] = f"{discount_percentage:.2f}% off"
                                                logging.info(f"Calculated discount: {product_json_data['discount_information']} for {product_json_data['url']}")
                                                print(f"Calculated discount: {product_json_data['discount_information']} for {product_json_data['url']}")
                                            else:
                                                logging.info(f"No discount applicable (MRP <= Price) for {product_json_data['url']}")
                                                print(f"No discount applicable (MRP <= Price) for {product_json_data['url']}")
                                        except ValueError as e:
                                            logging.warning(f"Error calculating discount for {product_json_data['url']}: {e}")
                                            print(f"Error calculating discount for {product_json_data['url']}: {e}")
                                    else:
                                        logging.warning(f"No discount found (missing MRP or price) for {product_json_data['url']}")
                                        print(f"No discount found (missing MRP or price) for {product_json_data['url']}")
                            except Exception as e:
                                logging.warning(f"Error extracting discount for {product_json_data['url']}: {e}")
                                print(f"Error extracting discount for {product_json_data['url']}: {e}")

                            # Extract product details
                            soup = BeautifulSoup(browser.page_source, "html.parser")
                            product_details = {}

                            # Primary selector: ul.detail-bullet-list
                            detail_lists = soup.select("ul.detail-bullet-list > li")
                            for li in detail_lists:
                                try:
                                    label_tag = li.select_one("span.a-text-bold")
                                    value_tag = label_tag.find_next_sibling("span") if label_tag else None
                                    if label_tag and value_tag:
                                        label = clean_text(label_tag.get_text(strip=True).replace(":", ""))
                                        value = clean_text(value_tag.get_text(" ", strip=True))
                                        if label and value:
                                            product_details[label] = value
                                except Exception as e:
                                    logging.warning(f"Error parsing product detail item for {product_json_data['url']}: {e}")
                                    print(f"Error parsing product detail item for {product_json_data['url']}: {e}")

                            # Fallback selector: table#productDetails_detailBullets_sections1
                            if not product_details:
                                try:
                                    details_table = soup.select_one("table#productDetails_detailBullets_sections1")
                                    if details_table:
                                        rows = details_table.find_all("tr")
                                        for row in rows:
                                            try:
                                                label = row.find("th", {"class": "a-color-secondary a-size-base prodDetSectionEntry"})
                                                value = row.find("td", {"class": "a-size-base prodDetAttrValue"})
                                                if label and value:
                                                    label_text = clean_text(label.get_text(strip=True).replace(":", ""))
                                                    value_text = clean_text(value.get_text(" ", strip=True))
                                                    if label_text and value_text:
                                                        product_details[label_text] = value_text
                                            except Exception as e:
                                                logging.warning(f"Error parsing table detail row for {product_json_data['url']}: {e}")
                                                print(f"Error parsing table detail row for {product_json_data['url']}: {e}")
                                except Exception as e:
                                    logging.warning(f"Error accessing fallback product details table for {product_json_data['url']}: {e}")
                                    print(f"Error accessing fallback product details table for {product_json_data['url']}: {e}")

                            # Add product details to product_json_data
                            product_json_data["Specifications"] = product_details
                            logging.info(f"Product details extracted: {product_details} for {product_json_data['url']}")
                            print(f"Product details extracted: {product_details} for {product_json_data['url']}")

                            # Extract product reviews
                            try:
                                product_review_element = retry_extraction(
                                    lambda: product_page_html.find("span", {"id": "acrCustomerReviewText"})
                                )
                                if product_review_element:
                                    product_review_text = clean_text(product_review_element.get_text(strip=True))
                                    numeric_match = re.search(r"(\d+)", product_review_text)
                                    if numeric_match:
                                        product_json_data["feedback"]["review"] = numeric_match.group(1)
                                        logging.info(f"Product reviews: {product_json_data['feedback']['review']} for {product_json_data['url']}")
                                        print(f"Product reviews: {product_json_data['feedback']['review']} for {product_json_data['url']}")
                            except Exception as e:
                                logging.warning(f"Error extracting product reviews for {product_json_data['url']}: {e}")
                                print(f"Error extracting product reviews for {product_json_data['url']}: {e}")

                            # Extract product rating
                            try:
                                product_rating_element = retry_extraction(
                                    lambda: product_page_html.find(
                                        lambda tag: tag.name == "span" and tag.get("id") == "acrPopover" and "reviewCountTextLinkedHistogram" in tag.get("class", []) and tag.has_attr("title")
                                    )
                                )
                                if product_rating_element:
                                    rating_span = product_rating_element.find("span", {"class": "a-size-base a-color-base"})
                                    if rating_span:
                                        product_json_data["feedback"]["rating"] = clean_text(rating_span.get_text(strip=True))
                                        logging.info(f"Product rating: {product_json_data['feedback']['rating']} for {product_json_data['url']}")
                                        print(f"Product rating: {product_json_data['feedback']['rating']} for {product_json_data['url']}")
                            except Exception as e:
                                logging.warning(f"Error extracting product rating for {product_json_data['url']}: {e}")
                                print(f"Error extracting product rating for {product_json_data['url']}: {e}")

                            # Extract product supplier
                            try:
                                product_supplier_element = product_page_html.find("a", {"id": "sellerProfileTriggerId"})
                                if not product_supplier_element:
                                    product_supplier_element = product_page_html.find("span", {"class": "tabular-buybox-text"})
                                if product_supplier_element:
                                    product_json_data["supplier"] = product_supplier_element.get_text(strip=True)
                                    logging.info(f"Product supplier: {product_json_data['supplier']} for {product_json_data['url']}")
                                    print(f"Product supplier: {product_json_data['supplier']} for {product_json_data['url']}")
                            except Exception as e:
                                logging.warning(f"Error extracting product supplier for {product_json_data['url']}: {e}")
                                print(f"Error extracting product supplier for {product_json_data['url']}: {e}")


                            # Extract product images
                            try:
                                altImages = WebDriverWait(browser, 10).until(
                                    EC.element_to_be_clickable((By.ID, "altImages"))
                                )
                                if altImages:
                                    imgButtons = altImages.find_elements(By.CSS_SELECTOR, "li.imageThumbnail")
                                    for imgButton in imgButtons:
                                        time.sleep(1)
                                        imgButton.click()
                                        time.sleep(1)
                                        product_image_wrapper = WebDriverWait(browser, 10).until(
                                            EC.element_to_be_clickable((By.CSS_SELECTOR, "ul.a-unordered-list.a-nostyle.a-horizontal.list.maintain-height"))
                                        )
                                        if product_image_wrapper:
                                            product_image_list = product_image_wrapper.find_element(By.CSS_SELECTOR, "li.selected")
                                            if product_image_list:
                                                product_image = product_image_list.find_element(By.CSS_SELECTOR, "img.a-dynamic-image")
                                                if product_image:
                                                    product_json_data['images'].append(product_image.get_attribute('src'))
                                                    logging.info(f"Product image: {product_json_data['images'][-1]} for {product_json_data['url']}")
                                                    print(f"Product image: {product_json_data['images'][-1]} for {product_json_data['url']}")
                            except Exception as e:
                                logging.warning(f"Error extracting product images for {product_json_data['url']}: {e}")
                                print(f"Error extracting product images for {product_json_data['url']}: {e}")

                        except Exception as e:
                            logging.error(f"Error processing product page {product_json_data['url']}: {e}")
                            print(f"Error processing product page {product_json_data['url']}: {e}")
                        finally:
                            browser.close()
                            browser.switch_to.window(browser.window_handles[0])

                    # Save unique product
                    scraped_products[product_json_data["url"]] = product_json_data

                # Break out of the retry loop for the page if successful
                break
            except Exception as e:
                logging.error(f"Attempt {attempt+1}/{retries}: Error scraping products from page {page}: {e}")
                print(f"Attempt {attempt+1}/{retries}: Error scraping products from page {page}: {e}")
                time.sleep(1)
        else:
            logging.error(f"Failed to scrape products from page {page} after {retries} attempts.")
            print(f"Failed to scrape products from page {page} after {retries} attempts.")

    # Save all unique scraped products to a JSON file
    with open("amazon_rolex.json", "w", encoding="utf-8") as f:
        json.dump(list(scraped_products.values()), f, ensure_ascii=False, indent=4)
    logging.info("Scraping completed and saved to amazon_rolex.json")
    print("Scraping completed and saved to amazon_rolex.json")
    browser.quit()

if __name__ == "_main_":
    try:
        scrape_amazon_products()
    except Exception as e:
        logging.error(f"Script terminated with error: {e}")
        print(f"Script terminated with error: {e}")
        browser.quit()