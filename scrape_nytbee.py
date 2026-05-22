"""
Scrape all historical NYT Spelling Bee answers from nytbee.com.
Deduplicates, converts to uppercase, saves to nyt_words.txt.

Usage: python3 scrape_nytbee.py
"""

import re
import time
import datetime
import requests
from bs4 import BeautifulSoup

START_DATE = datetime.date(2018, 6, 23)
END_DATE = datetime.date.today()
BASE_URL = "https://www.nytbee.com/Bee_{}.html"
OUTPUT_FILE = "nyt_words.txt"
DELAY = 0.5  # seconds between requests — be polite


def get_words_for_date(session, date):
    date_str = date.strftime("%Y%m%d")
    url = BASE_URL.format(date_str)
    try:
        resp = session.get(url, timeout=15)
        if resp.status_code == 404:
            return []
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  Error fetching {date_str}: {e}")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    answer_list = soup.find(id="main-answer-list")
    if not answer_list:
        return []

    # Words are text nodes in the flex-list-item div; the <a> just holds the ↗ link.
    # Most reliable: pull word from the onclick attribute: show_definition('word')
    words = []
    for a in answer_list.find_all("a", class_="link-definition"):
        onclick = a.get("onclick", "")
        m = re.search(r"show_definition\('([^']+)'\)", onclick)
        if m:
            words.append(m.group(1))
    return words


def main():
    all_words = set()
    total_dates = (END_DATE - START_DATE).days + 1

    session = requests.Session()
    session.headers["User-Agent"] = (
        "Mozilla/5.0 (compatible; nytbee-scraper/1.0; educational use)"
    )

    current = START_DATE
    fetched = 0
    skipped = 0

    print(f"Scraping {total_dates} dates from {START_DATE} to {END_DATE}...")

    while current <= END_DATE:
        words = get_words_for_date(session, current)
        if words:
            all_words.update(w.upper() for w in words)
            fetched += 1
            if fetched % 50 == 0:
                print(f"  {fetched} puzzles scraped, {len(all_words)} unique words so far...")
        else:
            skipped += 1

        current += datetime.timedelta(days=1)
        time.sleep(DELAY)

    sorted_words = sorted(all_words)
    with open(OUTPUT_FILE, "w") as f:
        f.write("\n".join(sorted_words) + "\n")

    print(f"\nDone.")
    print(f"  Puzzles with answers: {fetched}")
    print(f"  Dates skipped (404/error): {skipped}")
    print(f"  Unique words: {len(sorted_words)}")
    print(f"  Saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
