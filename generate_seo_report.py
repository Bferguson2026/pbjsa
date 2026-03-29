#!/usr/bin/env python3
"""Generate SEO Optimization Report PDF for PBJ Strategic Accounting."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

BROWN = HexColor("#3A2A21")
GOLD = HexColor("#A0784F")
MUTED = HexColor("#555555")
LIGHT_BG = HexColor("#FCF8F5")
HEADER_BG = HexColor("#3A2A21")
WHITE = HexColor("#FFFFFF")
ALT_ROW = HexColor("#F5F0EB")

def build():
    doc = SimpleDocTemplate(
        "/home/user/pbja/PBJ_SEO_Optimization_Report.pdf",
        pagesize=letter,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    styles.add(ParagraphStyle("CoverTitle", fontSize=26, leading=32, textColor=BROWN,
                              fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=8))
    styles.add(ParagraphStyle("CoverSub", fontSize=15, leading=20, textColor=GOLD,
                              fontName="Helvetica", alignment=TA_CENTER, spaceAfter=6))
    styles.add(ParagraphStyle("CoverDetail", fontSize=10, leading=14, textColor=HexColor("#888888"),
                              fontName="Helvetica", alignment=TA_CENTER, spaceAfter=4))
    styles.add(ParagraphStyle("SectionTitle", fontSize=14, leading=18, textColor=BROWN,
                              fontName="Helvetica-Bold", spaceBefore=16, spaceAfter=6))
    styles.add(ParagraphStyle("SubHead", fontSize=11, leading=14, textColor=HexColor("#50403D"),
                              fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=4))
    styles.add(ParagraphStyle("Body", fontSize=10, leading=14, textColor=MUTED,
                              fontName="Helvetica", spaceAfter=4))
    styles.add(ParagraphStyle("BoldBody", fontSize=10, leading=14, textColor=MUTED,
                              fontName="Helvetica", spaceAfter=6))
    styles.add(ParagraphStyle("BulletCustom", fontSize=10, leading=14, textColor=MUTED,
                              fontName="Helvetica", leftIndent=20, bulletIndent=10,
                              spaceAfter=2))
    styles.add(ParagraphStyle("SmallItalic", fontSize=9, leading=12, textColor=HexColor("#999999"),
                              fontName="Helvetica-Oblique", spaceBefore=2, spaceAfter=2))

    story = []

    # ── Cover Page ──
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph("SEO Optimization Report", styles["CoverTitle"]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("PBJ Strategic Accounting", styles["CoverSub"]))
    story.append(Paragraph("pbjsa.com", styles["CoverSub"]))
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="40%", thickness=1, color=GOLD, spaceBefore=10, spaceAfter=30))
    story.append(Paragraph("Date: March 27, 2026", styles["CoverDetail"]))
    story.append(Paragraph("Scope: All 9 pages + 2 new files", styles["CoverDetail"]))
    story.append(Paragraph("Prepared for: PBJ Strategic Accounting ownership", styles["CoverDetail"]))
    story.append(PageBreak())

    # ── Helper functions ──
    def sec(num, title):
        story.append(Paragraph(f"{num}. {title}", styles["SectionTitle"]))
        story.append(HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=8))

    def sub(text):
        story.append(Paragraph(text, styles["SubHead"]))

    def body(text):
        story.append(Paragraph(text, styles["Body"]))

    def bold_body(label, text):
        story.append(Paragraph(f"<b>{label}</b> {text}", styles["BoldBody"]))

    def bullet(text):
        story.append(Paragraph(f"\u2022  {text}", styles["BulletCustom"]))

    def make_table(headers, rows, col_widths=None):
        data = [headers] + rows
        if col_widths is None:
            col_widths = [doc.width / len(headers)] * len(headers)
        t = Table(data, colWidths=col_widths, repeatRows=1)
        style_cmds = [
            ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
            ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("LEADING", (0, 0), (-1, -1), 13),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("GRID", (0, 0), (-1, -1), 0.25, HexColor("#E0D8D0")),
        ]
        for i in range(1, len(data)):
            if i % 2 == 0:
                style_cmds.append(("BACKGROUND", (0, i), (-1, i), ALT_ROW))
            else:
                style_cmds.append(("BACKGROUND", (0, i), (-1, i), LIGHT_BG))
        t.setStyle(TableStyle(style_cmds))
        story.append(t)
        story.append(Spacer(1, 10))

    # ── Before vs After ──
    story.append(Paragraph("Before vs. After Summary", styles["SectionTitle"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=8))
    make_table(
        ["SEO Element", "Before", "After"],
        [
            ["robots.txt", "Missing", "Created"],
            ["sitemap.xml", "Missing", "Created (9 URLs)"],
            ["Canonical URLs", "None", "All 9 pages"],
            ["Open Graph Tags", "None", "All 9 pages"],
            ["Twitter Card Tags", "None", "All 9 pages"],
            ["JSON-LD Structured Data", "None", "7 schema types"],
            ["Font Preconnect Hints", "None", "All 9 pages"],
            ["Image Lazy Loading", "1 image", "3 images"],
        ],
        col_widths=[2.8*inch, 1.8*inch, 2.2*inch],
    )

    # ── 1. robots.txt ──
    sec("1", "robots.txt (New File)")
    bold_body("What it does:", "Tells search engines (Google, Bing, etc.) they are allowed to crawl the entire site and where to find the sitemap.")
    bold_body("Contents:", "Allows all user agents. Points crawlers to https://pbjsa.com/sitemap.xml.")
    bold_body("SEO impact:", "Without this file, crawlers use defaults. Having it explicitly confirms intent and speeds up sitemap discovery.")

    # ── 2. sitemap.xml ──
    sec("2", "sitemap.xml (New File)")
    bold_body("What it does:", "Provides search engines a complete map of every page on the site with priority rankings and update frequency hints.")
    sub("Pages Listed (9 total)")
    make_table(
        ["URL", "Priority", "Frequency"],
        [
            ["/ (Homepage)", "1.0", "Monthly"],
            ["/services.html", "0.9", "Monthly"],
            ["/pricing.html", "0.9", "Monthly"],
            ["/about.html", "0.8", "Monthly"],
            ["/contact.html", "0.8", "Monthly"],
            ["/faq.html", "0.7", "Monthly"],
            ["/blog/", "0.7", "Weekly"],
            ["/blog/top-7-mistakes-small-businesses...", "0.6", "Yearly"],
            ["/blog/why-businesses-need-clean-books...", "0.6", "Yearly"],
        ],
        col_widths=[3.8*inch, 1.2*inch, 1.8*inch],
    )
    bold_body("SEO impact:", "Ensures Google indexes every page. Especially important for blog posts that may not be linked prominently enough to be discovered by crawling alone.")

    # ── 3. Canonical URLs ──
    sec("3", "Canonical URLs (All 9 Pages)")
    bold_body("What it does:", 'A &lt;link rel="canonical"&gt; tag tells search engines which version of a URL is the "official" one.')
    bold_body("Why it matters:", "The site is accessible via both pbjsa.com and pbja.pages.dev (Cloudflare Pages). Without canonical tags, Google could treat these as duplicate content and split ranking authority between them. Canonicals consolidate all SEO value to pbjsa.com.")
    bold_body("Added to:", "index.html, about.html, services.html, pricing.html, faq.html, contact.html, blog/index.html, and both blog posts.")

    # ── 4. Open Graph ──
    sec("4", "Open Graph Meta Tags (All 9 Pages)")
    bold_body("What it does:", "Controls how the site appears when shared on Facebook, LinkedIn, iMessage, Slack, and other platforms that read Open Graph tags.")
    sub("Tags Added Per Page")
    bullet("og:type \u2014 'website' for main pages, 'article' for blog posts")
    bullet("og:url \u2014 The canonical URL")
    bullet("og:title \u2014 Optimized title (shorter than &lt;title&gt; tag for better display)")
    bullet("og:description \u2014 Concise summary tailored for social sharing")
    bullet("og:image \u2014 Logo for main pages, headshot for the About page")
    bullet("og:site_name \u2014 'PBJ Strategic Accounting'")
    bullet("article:author \u2014 'Brittany Ferguson' (blog posts only)")
    story.append(Spacer(1, 4))
    bold_body("SEO impact:", "Before this, sharing any page on Facebook or LinkedIn would show a generic or broken preview. Now every page renders a branded card with title, description, and image.")

    # ── 5. Twitter Cards ──
    sec("5", "Twitter Card Meta Tags (All 9 Pages)")
    bold_body("What it does:", "Same concept as Open Graph but specifically for X/Twitter's card format.")
    sub("Tags Added Per Page")
    bullet("twitter:card \u2014 'summary_large_image' for key pages, 'summary' for secondary")
    bullet("twitter:title \u2014 Optimized for Twitter's character display")
    bullet("twitter:description \u2014 Concise summary")
    bullet("twitter:image \u2014 Branded image")
    story.append(Spacer(1, 4))
    bold_body("SEO impact:", "Tweets or posts linking to the site now show rich preview cards instead of plain text URLs.")

    # ── 6. Structured Data ──
    sec("6", "JSON-LD Structured Data (7 Schema Types)")
    body("This is the highest-impact change. JSON-LD tells Google exactly what the business is, what services it offers, and how to display it in search results with 'rich snippets.'")

    sub("6a. Homepage \u2014 LocalBusiness + WebSite")
    body("Data included: Business name, description, URL, phone (904-708-2411), email, logo, founder (Brittany Ferguson), full address (1845 Town Center Blvd Suite #205, Fleming Island, FL 32003), geo coordinates for Google Maps, hours (Mon\u2013Fri 8am\u20135pm), service area (Clay County + Northeast FL), and price range.")
    bold_body("Google impact:", "Enables the Google Knowledge Panel (the info box on the right side of search results). Also powers Google Maps local pack results showing the business with address, hours, and phone number.")

    sub("6b. About Page \u2014 Person")
    body("Data included: Brittany Ferguson's name, job title (Founder & Lead Accountant), employer, description, photo, phone, and email.")
    bold_body("Google impact:", "Helps Google associate Brittany Ferguson with the business. Can surface a people card in search results.")

    sub("6c. Services Page \u2014 ItemList of 7 Services")
    body("All seven services listed with descriptions: Bookkeeping, Fractional CFO Services, QuickBooks Clean-Up, Cash Flow Management, Budgeting & Forecasting, Financial Reporting, and Financial Planning.")
    bold_body("Google impact:", "Can generate service-rich snippets in search results, showing the list of offerings directly below the search result link.")

    sub("6d. Pricing Page \u2014 OfferCatalog")
    body("Five plans listed: The Uncrustable ($400/mo starting price), Just the Crust, The Classic, The Jelly Royale, and The Ultimate Spread.")
    bold_body("Google impact:", "Enables pricing information to appear in search results. The $400/month starting price can show directly in Google.")

    sub("6e. FAQ Page \u2014 FAQPage (17 Q&A Pairs)")
    body("This is the single biggest SEO win. All 17 frequently asked questions and answers are now marked up with FAQPage schema across 5 categories:")
    story.append(Spacer(1, 4))

    story.append(Paragraph("<i>Getting Started (4 questions)</i>", styles["SmallItalic"]))
    bullet("How do I get started with PBJ Strategic Accounting?")
    bullet("Do you offer a free consultation?")
    bullet("What do I need to bring to my first meeting?")
    bullet("How quickly can you get started once I sign on?")

    story.append(Paragraph("<i>Services (4 questions)</i>", styles["SmallItalic"]))
    bullet("What services do you offer?")
    bullet("Do you handle tax filing?")
    bullet("What is a Fractional CFO and do I need one?")
    bullet("My QuickBooks is a complete mess. Can you fix it?")

    story.append(Paragraph("<i>Pricing (2 questions)</i>", styles["SmallItalic"]))
    bullet("How much do your services cost?")
    bullet("Are there any hidden fees or surprise charges?")

    story.append(Paragraph("<i>Working Together (4 questions)</i>", styles["SmallItalic"]))
    bullet("Do I have to come into your office in person?")
    bullet("What accounting software do you use?")
    bullet("How often will I hear from you?")
    bullet("Can you work alongside my existing CPA or tax preparer?")

    story.append(Paragraph("<i>Location & Hours (3 questions)</i>", styles["SmallItalic"]))
    bullet("Where are you located?")
    bullet("What are your office hours?")
    bullet("Do you work with businesses outside Clay County?")

    story.append(Spacer(1, 6))
    bold_body("Google impact:", "Google can now display expandable FAQ dropdowns directly in search results. This dramatically increases the visual size of the search listing, pushing competitors further down the page and significantly boosting click-through rates.")

    sub("6f. Contact Page \u2014 LocalBusiness")
    body("Data included: Business name, URL, phone, email, full address, and operating hours.")
    bold_body("Google impact:", "Reinforces local business data for Google Maps and local search results.")

    sub("6g. Blog Posts (2) \u2014 BlogPosting")
    body("Data included per post: Headline, description, URL, author (Brittany Ferguson), publisher (PBJ Strategic Accounting with logo), publication date, and main entity reference.")
    bold_body("Google impact:", "Enables article rich results in Google Search, showing author name, publication date, and thumbnail alongside the search listing.")

    # ── 7. Preconnect ──
    sec("7", "Google Fonts Preconnect Hints (All 9 Pages)")
    bold_body("What it does:", "Added &lt;link rel='preconnect'&gt; for fonts.googleapis.com and fonts.gstatic.com to every page.")
    bold_body("Before:", "The browser discovered these connections only after parsing the CSS file's @import statement, adding latency.")
    bold_body("After:", "The browser begins DNS lookup and TLS handshake immediately while parsing the HTML, before reaching the CSS file.")
    bold_body("Performance impact:", "Reduces font loading time by ~100\u2013300ms. Faster fonts means less layout shift and better Core Web Vitals scores, which Google uses as a ranking factor.")

    # ── 8. Lazy Loading ──
    sec("8", "Image Lazy Loading")
    bold_body("What it does:", 'Added loading="lazy" to testimonial avatar images on the homepage (Stephanie Corbitt and Sandy Toledo review photos).')
    bold_body("Before:", "Only 1 image had lazy loading (Brittany's headshot on the About page).")
    bold_body("After:", "3 images now lazy load. Hero/logo images intentionally left eager-loaded since they are above the fold.")
    bold_body("Performance impact:", "Reduces initial page weight by deferring offscreen image downloads. Improves Largest Contentful Paint (LCP) and overall Core Web Vitals.")

    # ── Already Good ──
    story.append(PageBreak())
    story.append(Paragraph("What Was Already in Good Shape", styles["SectionTitle"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=8))
    body("No changes were needed for the following \u2014 these were already well-implemented:")
    story.append(Spacer(1, 4))
    for item in [
        "Page titles \u2014 Unique, keyword-rich, properly formatted on all pages",
        "Meta descriptions \u2014 Well-written, 155\u2013160 characters, unique per page",
        "Heading hierarchy \u2014 Proper H1 > H2 > H3 nesting throughout",
        "Semantic HTML \u2014 header, nav, main, article, footer used correctly",
        "Accessibility \u2014 WCAG 2.1 AA compliant (skip links, ARIA labels, focus management)",
        "Image alt text \u2014 Descriptive alt text on all meaningful images",
        "Mobile responsive \u2014 Viewport meta tag, responsive CSS throughout",
        "Performance \u2014 No framework bloat, minimal JS, Cloudflare CDN delivery",
    ]:
        bullet(item)

    # ── Next Steps ──
    story.append(Spacer(1, 16))
    story.append(Paragraph("Recommended Next Steps", styles["SectionTitle"]))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=8))

    steps = [
        ("Submit sitemap to Google Search Console", "Go to search.google.com/search-console, verify the domain, and submit sitemap.xml. This tells Google directly about all your pages."),
        ("Submit sitemap to Bing Webmaster Tools", "Same process at bing.com/webmasters for Bing search coverage."),
        ("Create a dedicated OG share image", "A branded 1200x630px image would look much better than the logo when shared on social media platforms."),
        ("Optimize large images", "The headshot (977 KB), header image (1.6 MB), and video poster (1.2 MB) could be compressed or converted to WebP format for faster page loading."),
        ("Set up Google Business Profile", "If not already created, a Google Business Profile will complement the structured data and put PBJ in Google Maps results with reviews, hours, and photos."),
        ("Monitor rich results", "Use Google's Rich Results Test tool to verify the structured data is being picked up and rendered correctly."),
    ]
    for i, (title, desc) in enumerate(steps, 1):
        story.append(Paragraph(f"<b>{i}. {title}</b>", styles["BoldBody"]))
        body(desc)

    doc.build(story)
    print("PDF generated successfully!")

if __name__ == "__main__":
    build()
