name: Contest Crawler

on:
  schedule:
    - cron: '0 2 * * *'   # 매일 오전 02:00 UTC (한국 11:00 AM)
  workflow_dispatch:        # 수동 실행 허용

jobs:
  crawl-contests:
    runs-on: ubuntu-latest
    timeout-minutes: 30

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

      - name: Run Kontest crawler
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: python scrapers/kontest.py
        continue-on-error: true

      - name: Run Wevity crawler
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: python scrapers/wevity.py
        continue-on-error: true

      - name: Run Linkareer crawler
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: python scrapers/linkareer.py
        continue-on-error: true

      - name: Notify on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `[크롤러 오류] 공모전 크롤러 실패 - ${new Date().toISOString()}`,
              body: '공모전 크롤러 GitHub Actions 워크플로우가 실패했습니다. 로그를 확인해주세요.',
              labels: ['bug', 'crawler']
            })
