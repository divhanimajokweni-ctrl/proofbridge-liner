'use client';

import { FormEvent, useMemo, useState } from 'react';

type DatasetRow = {
  source: string;
  vendor: string;
  title: string;
  priceDisplay: string;
  keywordTokens: string[];
};

type SparklinePoint = {
  date: string;
  priceDisplay: string;
};

type ComparisonOffer = {
  vendor: string;
  sourceName: string;
  title: string;
  totalPriceDisplay: string;
  url: string;
};

type ComparisonRow = {
  rank: number;
  productId: string;
  productName: string;
  lowestPriceDisplay: string;
  averagePriceDisplay: string;
  vendorCount: number;
  priceSpreadDisplay: string;
  trendSummary: string;
  recommendationLabel: string;
  bestOfferVendor: string;
  bestOfferSource: string;
  specSummary: string;
  sparklinePath: string;
  sparklinePoints: SparklinePoint[];
  offers: ComparisonOffer[];
};

type SearchResult = {
  invariant: string;
  architecture: {
    kernel: string;
    transport: string;
    store: string;
    projectors: string[];
    ui: string;
  };
  run: {
    keyword: string;
    crawlId: string;
    totalEvents: number;
    observedOffers: number;
    cleanedOffers: number;
    uniqueProducts: number;
    duplicatesRemoved: number;
    sourcesVisited: number;
  };
  datasetPreview: {
    description: string;
    totalSeedRows: number;
    rows: DatasetRow[];
  };
  comparisons: ComparisonRow[];
  events: Array<{
    eventId: string;
    eventType: string;
    occurredAt: string;
  }>;
};

type InitialPayload = {
  sampleKeyword: string;
  sampleKeywords: string[];
  sampleResult: SearchResult;
  sampleDataset: SearchResult['datasetPreview'];
};

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metricCard">
      <div className="metricValue">{value}</div>
      <div className="metricLabel">{label}</div>
    </div>
  );
}

function Sparkline({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 180 54" className="sparkline" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function VvuCrawlerDemo({ initialData }: { initialData: InitialPayload }) {
  const [keyword, setKeyword] = useState(initialData.sampleKeyword);
  const [result, setResult] = useState<SearchResult>(initialData.sampleResult);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commandPreview = useMemo(
    () => `npm run vvu:crawl -- --keyword "${keyword || initialData.sampleKeyword}"`,
    [initialData.sampleKeyword, keyword],
  );

  async function runSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRunning(true);
    setError(null);

    try {
      const response = await fetch('/api/vvu-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, maxResults: 24 }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string; message?: string; result?: SearchResult };

      if (!response.ok || !payload.ok || !payload.result) {
        throw new Error(payload.message ?? payload.error ?? 'Unable to run crawler.');
      }

      setResult(payload.result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unknown crawler error.');
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="pageShell">
      <section className="hero">
        <div className="heroCopy">
          <span className="eyebrow">VVU ProofBridge Liner</span>
          <h1>Event-sourced market crawler demo</h1>
          <p>
            The crawler treats observed listings as the only truth. Cleaning, deduplication, ranking, comparison
            tables, trend charts, and value labels are deterministic projections from that event stream.
          </p>
        </div>
        <div className="heroPanel">
          <div className="panelLabel">Direct CLI</div>
          <code>{commandPreview}</code>
          <div className="panelHint">The web page triggers the same shared engine through `/api/vvu-search`.</div>
        </div>
      </section>

      <section className="panel">
        <form className="searchForm" onSubmit={runSearch}>
          <label className="field">
            <span>Keyword</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Enter a product keyword"
            />
          </label>
          <button type="submit" disabled={isRunning}>
            {isRunning ? 'Running...' : 'Run Live Search'}
          </button>
        </form>
        <div className="chipRow">
          {initialData.sampleKeywords.map((item) => (
            <button key={item} type="button" className="chip" onClick={() => setKeyword(item)}>
              {item}
            </button>
          ))}
        </div>
        {error ? <p className="errorText">{error}</p> : null}
      </section>

      <section className="metricsGrid">
        <MetricCard label="Invariant" value={result.invariant} />
        <MetricCard label="Events" value={result.run.totalEvents} />
        <MetricCard label="Observed Offers" value={result.run.observedOffers} />
        <MetricCard label="Duplicates Removed" value={result.run.duplicatesRemoved} />
        <MetricCard label="Unique Products" value={result.run.uniqueProducts} />
      </section>

      <section className="layoutGrid">
        <article className="panel">
          <div className="sectionTitle">Architecture projection</div>
          <div className="architectureGrid">
            <div className="architectureCard">
              <div className="cardLabel">Kernel</div>
              <strong>{result.architecture.kernel}</strong>
            </div>
            <div className="architectureCard">
              <div className="cardLabel">Transport</div>
              <strong>{result.architecture.transport}</strong>
            </div>
            <div className="architectureCard">
              <div className="cardLabel">Store</div>
              <strong>{result.architecture.store}</strong>
            </div>
            <div className="architectureCard">
              <div className="cardLabel">UI</div>
              <strong>{result.architecture.ui}</strong>
            </div>
          </div>
          <div className="projectorList">
            {result.architecture.projectors.map((projector) => (
              <span key={projector} className="projectorChip">
                {projector}
              </span>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="sectionTitle">Sample dataset</div>
          <p className="mutedText">
            {initialData.sampleDataset.description}. The table below shows a subset of the seeded records used during
            initialization.
          </p>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Vendor</th>
                  <th>Title</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {initialData.sampleDataset.rows.map((row) => (
                  <tr key={`${row.source}-${row.vendor}-${row.title}`}>
                    <td>{row.source}</td>
                    <td>{row.vendor}</td>
                    <td>{row.title}</td>
                    <td>{row.priceDisplay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="sectionTitle">Horizontal product comparison</div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>Lowest price</th>
                <th>Average price</th>
                <th>Vendors</th>
                <th>Spread</th>
                <th>Trend</th>
                <th>Value label</th>
              </tr>
            </thead>
            <tbody>
              {result.comparisons.map((row) => (
                <tr key={row.productId}>
                  <td>{row.rank}</td>
                  <td>
                    <strong>{row.productName}</strong>
                    <div className="subtleLine">{row.specSummary}</div>
                  </td>
                  <td>{row.lowestPriceDisplay}</td>
                  <td>{row.averagePriceDisplay}</td>
                  <td>{row.vendorCount}</td>
                  <td>{row.priceSpreadDisplay}</td>
                  <td>{row.trendSummary}</td>
                  <td>
                    <span className="tag">{row.recommendationLabel}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="comparisonCards">
        {result.comparisons.map((row) => (
          <article key={row.productId} className="panel productCard">
            <div className="cardHeader">
              <div>
                <div className="sectionTitle">{row.productName}</div>
                <p className="mutedText">{row.specSummary}</p>
              </div>
              <span className="tag">{row.recommendationLabel}</span>
            </div>
            <div className="trendPanel">
              <Sparkline path={row.sparklinePath} />
              <div className="trendMeta">
                {row.sparklinePoints.map((point) => (
                  <div key={`${row.productId}-${point.date}`} className="trendPoint">
                    <span>{point.date}</span>
                    <strong>{point.priceDisplay}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="offerList">
              {row.offers.map((offer) => (
                <a key={`${row.productId}-${offer.vendor}-${offer.sourceName}`} href={offer.url} className="offerCard">
                  <strong>{offer.vendor}</strong>
                  <span>{offer.sourceName}</span>
                  <span>{offer.totalPriceDisplay}</span>
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="layoutGrid">
        <article className="panel">
          <div className="sectionTitle">Event stream snapshot</div>
          <div className="eventList">
            {result.events.slice(0, 10).map((event) => (
              <div key={event.eventId} className="eventRow">
                <strong>{event.eventType}</strong>
                <span>{new Date(event.occurredAt).toLocaleTimeString('en-ZA')}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="sectionTitle">Current run summary</div>
          <div className="summaryList">
            <div className="summaryRow">
              <span>Keyword</span>
              <strong>{result.run.keyword}</strong>
            </div>
            <div className="summaryRow">
              <span>Sources visited</span>
              <strong>{result.run.sourcesVisited}</strong>
            </div>
            <div className="summaryRow">
              <span>Cleaned offers</span>
              <strong>{result.run.cleanedOffers}</strong>
            </div>
            <div className="summaryRow">
              <span>Unique products</span>
              <strong>{result.run.uniqueProducts}</strong>
            </div>
          </div>
        </article>
      </section>

      <style jsx>{`
        .pageShell {
          min-height: 100vh;
          padding: 32px;
          background:
            radial-gradient(circle at top, rgba(24, 126, 255, 0.18), transparent 30%),
            linear-gradient(180deg, #08111f 0%, #030712 100%);
          color: #edf2ff;
        }
        .hero,
        .layoutGrid,
        .metricsGrid,
        .comparisonCards {
          display: grid;
          gap: 20px;
          margin-bottom: 20px;
        }
        .hero {
          grid-template-columns: 2fr 1fr;
          align-items: stretch;
        }
        .layoutGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .metricsGrid {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }
        .comparisonCards {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .panel,
        .heroPanel,
        .metricCard {
          background: rgba(8, 15, 27, 0.88);
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
        }
        .heroCopy h1 {
          font-size: clamp(2.4rem, 4vw, 4.3rem);
          line-height: 1.02;
          margin: 8px 0 16px;
        }
        .heroCopy p,
        .mutedText,
        .panelHint,
        .subtleLine {
          color: rgba(226, 232, 240, 0.76);
        }
        .eyebrow,
        .panelLabel,
        .cardLabel,
        .sectionTitle {
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.78rem;
          color: #7dd3fc;
        }
        .sectionTitle {
          margin-bottom: 14px;
        }
        .heroPanel code {
          display: block;
          margin: 12px 0;
          padding: 14px;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.94);
          overflow-x: auto;
        }
        .searchForm {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: end;
        }
        .field {
          display: grid;
          gap: 8px;
        }
        .field input {
          width: 100%;
          background: rgba(15, 23, 42, 0.95);
          color: #edf2ff;
          border: 1px solid rgba(148, 163, 184, 0.28);
          border-radius: 14px;
          padding: 14px 16px;
          font-size: 1rem;
        }
        button {
          border: 0;
          border-radius: 14px;
          padding: 14px 18px;
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          color: white;
          font-weight: 700;
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.7;
          cursor: wait;
        }
        .chipRow,
        .projectorList {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
        }
        .chip,
        .projectorChip,
        .tag {
          background: rgba(37, 99, 235, 0.16);
          border: 1px solid rgba(96, 165, 250, 0.28);
          border-radius: 999px;
          padding: 8px 12px;
          color: #bfdbfe;
        }
        .chip {
          font: inherit;
        }
        .metricCard {
          min-height: 124px;
          display: grid;
          align-content: space-between;
        }
        .metricValue {
          font-size: 1.1rem;
          line-height: 1.35;
          font-weight: 700;
        }
        .metricLabel {
          color: rgba(226, 232, 240, 0.74);
        }
        .architectureGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .architectureCard,
        .offerCard,
        .eventRow,
        .summaryRow {
          display: grid;
          gap: 6px;
          padding: 14px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 16px;
        }
        .tableWrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 720px;
        }
        th,
        td {
          text-align: left;
          padding: 14px 12px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.14);
          vertical-align: top;
        }
        th {
          color: #93c5fd;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .productCard {
          display: grid;
          gap: 16px;
        }
        .cardHeader {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: start;
        }
        .trendPanel {
          display: grid;
          grid-template-columns: 180px 1fr;
          gap: 16px;
          align-items: center;
        }
        .sparkline {
          width: 180px;
          height: 54px;
          color: #38bdf8;
        }
        .trendMeta,
        .offerList,
        .eventList,
        .summaryList {
          display: grid;
          gap: 10px;
        }
        .trendPoint {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: rgba(226, 232, 240, 0.88);
        }
        .offerList {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .offerCard:hover {
          border-color: rgba(96, 165, 250, 0.44);
        }
        .errorText {
          margin-top: 14px;
          color: #fca5a5;
        }
        @media (max-width: 1100px) {
          .hero,
          .layoutGrid,
          .comparisonCards,
          .metricsGrid,
          .offerList,
          .trendPanel {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 760px) {
          .pageShell {
            padding: 18px;
          }
          .searchForm {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
