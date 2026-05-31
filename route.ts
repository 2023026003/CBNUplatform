name: Sports Facility Crawler

on:
  schedule:
    - cron: '5 * * * *'   # 매시간 05분 (Vercel cron과 겹치지 않게)
  workflow_dispatch:

jobs:
  crawl-sports:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: scrapers/requirements.txt

      - name: Install dependencies
        run: |
          pip install -r scrapers/requirements.txt
          playwright install chromium

      - name: Run sports facility crawler
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          CBNU_SPORTS_URL: ${{ secrets.CBNU_SPORTS_URL }}
        run: python scrapers/sports_facility.py

      - name: Notify on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `[크롤러 오류] 체육시설 크롤러 실패 - ${new Date().toISOString()}`,
              body: '체육시설 크롤러가 실패했습니다. 충북대 시설 예약 사이트를 확인해주세요.',
              labels: ['bug', 'crawler']
            })
