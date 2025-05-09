import time
import json
import os
import uuid
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException

# Create images folder if it doesn't exist
os.makedirs("images", exist_ok=True)

# Initialize the products.json file as an empty list for incremental insertion
with open("products.json", "w", encoding="utf-8") as f:
    json.dump([], f)

# Global scraping configurations
retries = 3
search_page = 10
search_keyword = "Caterpillar"

# Setup Selenium configurations
options = webdriver.FirefoxOptions()
options.add_argument("--ignore-certificate-errors")
options.add_argument("--log-level=3")
options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
browser = webdriver.Firefox(options=options)
browser.maximize_window()

def retry_extraction(func, attempts=3, delay=1, default=""):
    for i in range(attempts):
        try:
            result = func()
            if result:
                return result
        except Exception:
            time.sleep(delay)
    return default

def append_product_to_json(product):
    try:
        if os.path.exists("products.json"):
            with open("products.json", "r", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                except Exception:
                    data = []
        else:
            data = []
        data.append(product)
        with open("products.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
    except Exception as e:
        print(f"Error appending product to JSON file: {e}")

def scrape_madeinchina_products():
    scraped_products = {}
    for page in range(1, search_page + 1):
        for attempt in range(retries):
            try:
                search_url = f'https://www.made-in-china.com/multi-search/{search_keyword}/F1/{page}.html?pv_id=1ik76htapa40&faw_id=null'
                browser.get(search_url)
                WebDriverWait(browser, 10).until(lambda d: d.execute_script("return document.readyState") == "complete")
                time.sleep(2)  # Allow extra time for dynamic content

                product_cards_container = browser.find_element(By.CSS_SELECTOR, '.prod-list')
                if not product_cards_container:
                    print(f"No products found on page {page}")
                    break

                product_cards_html = BeautifulSoup(product_cards_container.get_attribute("outerHTML"), "html.parser")
                product_cards = product_cards_html.find_all("div", {"class": "prod-info"})

                for product in product_cards:
                    product_json_data = {
                        "url": "",
                        "title": "",
                        "currency": "",
                        "exact_price": "",
                        "min_order": "",
                        "supplier": "",
                        "origin": "",
                        "feedback": {
                            "rating": "",
                        },
                        "specifications": "",
                        "images": [],
                        "videos": [],
                        "website_name": "MadeinChina",
                        "discount_information": "N/A",
                        "brand_name": "N/A"
                    }
                    
                

                    # Extract product URL
                    try:
                        product_link = product.select_one('.product-name a').get('href')
                        if product_link.startswith('//'):
                            product_url = 'https:' + product_link
                        else:
                            product_url = product_link
                        product_json_data["url"] = product_url
                    except Exception as e:
                        print(f"Error extracting product URL: {e}")

                    # Extract product title
                    try:
                        product_title = product.select_one('.product-name').get('title').strip()
                        product_json_data["title"] = product_title
                    except Exception as e:
                        print(f"Error extracting product title: {e}")

                    # Skip if product URL already scraped
                    if product_json_data["url"] in scraped_products:
                        continue

                    # Extract currency and price
                    try:
                        currency_price_element = product.select_one('.product-property .price-info .price')
                        if currency_price_element:
                            currency_price_text = currency_price_element.get_text(strip=True)
                            currency = ''.join([c for c in currency_price_text if not c.isdigit() and c not in ['.', '-', ' ']]).strip()
                            product_json_data["currency"] = currency
                            price_range = currency_price_text.replace(currency, '').strip()
                            product_json_data["exact_price"] = price_range
                    except Exception as e:
                        print(f"Error extracting product currency and price: {e}")

                    # Extract minimum order
                    try:
                        min_order_element = product.find_all('div', class_='info')
                        for min_order_info in min_order_element:
                            if '(MOQ)' in min_order_info.text:
                                min_order_text = min_order_info.text.strip()
                                min_order = min_order_text.replace('(MOQ)', '').strip()
                                product_json_data["min_order"] = min_order
                                break
                    except Exception as e:
                        print(f"Error extracting product minimum order: {e}")

                    # Extract supplier name
                    try:
                        supplier_name_element = product.select_one('.company-name-wrapper .compnay-name span')
                        if supplier_name_element:
                            product_json_data["supplier"] = supplier_name_element.get_text(strip=True)
                    except Exception as e:
                        print(f"Error extracting supplier name: {e}")

                    # Scrape product page details
                    if product_json_data["url"]:
                        try:
                            browser.execute_script("window.open('');")
                            browser.switch_to.window(browser.window_handles[-1])
                            browser.get(product_json_data["url"])
                            WebDriverWait(browser, 10).until(lambda d: d.execute_script("return document.readyState") == "complete")
                            time.sleep(2)  # Allow dynamic content to load
                            browser.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                            time.sleep(1)  # Allow lazy-loaded content
                            product_page_html = BeautifulSoup(browser.page_source, "html.parser")

                            # Extract origin
                            try:
                                product_origin_info = product_page_html.select_one('.basic-info-list')
                                if product_origin_info:
                                    product_origin_container = product_origin_info.find_all('div', class_='bsc-item cf')
                                    for item in product_origin_container:
                                        label = item.find('div', class_='bac-item-label fl')
                                        if label and 'Origin' in label.text:
                                            value = item.find('div', class_='bac-item-value fl')
                                            product_json_data["origin"] = value.get_text(strip=True)
                            except Exception as e:
                                print(f"Error extracting origin: {e}")

                            # Extract rating and star count
                            try:
                                WebDriverWait(browser, 10).until(
                                    EC.presence_of_element_located((By.CSS_SELECTOR, "a.J-company-review .review-score"))
                                )
                                rating_elem = browser.find_element(By.CSS_SELECTOR, "a.J-company-review .review-score")
                                rating_text = rating_elem.text
                                star_elems = browser.find_elements(By.CSS_SELECTOR, "a.J-company-review .review-rate i")
                                star_count = len(star_elems)
                                product_json_data["feedback"]["rating"] = rating_text
                                product_json_data["feedback"]["star count"] = str(star_count)
                                print(f"Extracted Rating: {rating_text}, Star Count: {star_count}")
                            except NoSuchElementException:
                                print("Review elements not found on page.")
                                product_json_data["feedback"]["rating"] = "No rating available"
                                product_json_data["feedback"]["star count"] = "0"
                            except TimeoutException:
                                print("Timeout waiting for review elements to load.")
                                product_json_data["feedback"]["rating"] = "No rating available"
                                product_json_data["feedback"]["star count"] = "0"
                            except Exception as e:
                                print(f"Unexpected error extracting reviews: {e}")
                                product_json_data["feedback"]["rating"] = "No rating available"
                                product_json_data["feedback"]["star count"] = "0"
                                
                                
                            #specifications:
                            specifications = {}

                            # Find all the rows inside the specifications section
                            rows = browser.find_elements(By.XPATH, "//div[@class='basic-info-list']/div[@class='bsc-item cf']")

                            for row in rows:
                                try:
                                    # Locate the label and value divs inside each row
                                    label_div = row.find_element(By.XPATH, ".//div[contains(@class,'bac-item-label')]")
                                    value_div = row.find_element(By.XPATH, ".//div[contains(@class,'bac-item-value')]")

                                    # Extract text and strip whitespace
                                    label = label_div.text.strip()
                                    value = value_div.text.strip()

                                    # Store in dictionary
                                    if label and value:
                                        specifications[label] = value
                                except Exception as e:
                                    print(f"Error processing row: {e}")

                            # Print or use the extracted specifications
                            print(specifications)
                            product_json_data["specifications"] = specifications
                            
                    

                            # Extract images and videos
                            try:
                                swiper = product_page_html.find("div", {"class": "sr-proMainInfo-slide-container"})
                                if swiper:
                                    wrapper = swiper.find("div", {"class": "swiper-wrapper"})
                                    media_blocks = wrapper.find_all("div", {"class": "sr-prMainInfo-slide-inner"})
                                    for media in media_blocks:
                                        videos = media.find_all("script", {"type": "text/data-video"})
                                        for vid in videos:
                                            video_data = json.loads(vid.get_text(strip=True))
                                            video_url = video_data.get("videoUrl")
                                            product_json_data["videos"].append(video_url)
                                        images = media.find_all("img")
                                        for img in images:
                                            src = img["src"]
                                            if src.startswith("//"):
                                                src = "https:" + src
                                            product_json_data["images"].append(src)
                            except Exception as e:
                                print(f"Error extracting media: {e}")

                        except Exception as e:
                            print(f"Error processing product page: {e}")
                        finally:
                            browser.close()
                            browser.switch_to.window(browser.window_handles[0])

                    scraped_products[product_json_data["url"]] = product_json_data
                    append_product_to_json(product_json_data)

                break
            except Exception as e:
                print(f"Attempt {attempt + 1}/{retries}: Error scraping products from page {page}: {e}")
                time.sleep(5)
        else:
            print(f"Failed to scrape products from page {page} after {retries} attempts.")

    with open("products.json", "w", encoding="utf-8") as f:
        json.dump(list(scraped_products.values()), f, ensure_ascii=False, indent=4)
    browser.quit()
    print("Scraping completed and saved to products.json")

if __name__ == "_main_":
    scrape_madeinchina_products()