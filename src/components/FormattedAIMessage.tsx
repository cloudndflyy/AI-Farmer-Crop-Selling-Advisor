import React from 'react';
import { ChatMessage, ChatVisualCard, ChatMandiTableRow } from '../types';

interface FormattedAIMessageProps {
  message: ChatMessage;
  onNavigate?: (view: any) => void;
  onActionClick?: (actionText: string) => void;
  onRetry?: (query?: string) => void;
}

// Helper to sanitize inline markdown (removes **, *, _, ##, backticks, pipes, etc.)
export const cleanInlineMarkdown = (text: string): React.ReactNode[] => {
  if (!text) return [];

  // Remove any stray pipe characters, dashes line, or header marks
  let sanitized = text
    .replace(/^#+\s+/gm, '') // Remove ## heading marks
    .replace(/`([^`]+)`/g, '$1') // Remove backticks
    .replace(/\|/g, '') // Remove stray pipes
    .replace(/^[-\s]{3,}$/gm, ''); // Remove --- dividers

  // Regex to split by **bold** or *italic*
  const parts = sanitized.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2).trim();
      return (
        <strong key={index} className="font-bold text-[#1F2937]">
          {inner}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      const inner = part.slice(1, -1).trim();
      return (
        <span key={index} className="italic text-[#1F2937]">
          {inner}
        </span>
      );
    }
    return (
      <span key={index} className="text-[#1F2937]">
        {part}
      </span>
    );
  });
};

// Parse raw markdown table if present in raw text
interface ParsedTable {
  headers: string[];
  rows: string[][];
}

const extractMarkdownTable = (text: string): { cleanText: string; table: ParsedTable | null } => {
  const lines = text.split('\n');
  const tableLines: string[] = [];
  const nonTableLines: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Check if line looks like markdown table row with pipe characters
    if (line.startsWith('|') && line.endsWith('|')) {
      inTable = true;
      // Skip separator rows like | --- | --- |
      if (/^\|[\s\-:|]+\|$/.test(line)) {
        continue;
      }
      tableLines.push(line);
    } else {
      if (inTable && line === '') {
        inTable = false;
      }
      nonTableLines.push(lines[i]);
    }
  }

  if (tableLines.length >= 2) {
    const parseRow = (row: string) =>
      row
        .split('|')
        .map((cell) => cell.trim().replace(/\*\*/g, ''))
        .filter((cell, idx, arr) => idx > 0 && idx < arr.length - 1);

    const headers = parseRow(tableLines[0]);
    const rows = tableLines.slice(1).map(parseRow);

    return {
      cleanText: nonTableLines.join('\n').trim(),
      table: { headers, rows },
    };
  }

  return { cleanText: text, table: null };
};

// Check if text has a structured prediction block (e.g. Current price: ₹..., Expected price: ₹...)
const extractPredictionBlock = (text: string): { cleanText: string; card: ChatVisualCard | null } => {
  const currentMatch = text.match(/Current price:?\s*₹?([0-9,]+)/i);
  const expectedMatch = text.match(/Expected price:?\s*₹?([0-9,]+)/i);

  if (currentMatch && expectedMatch) {
    const currentPrice = parseInt(currentMatch[1].replace(/,/g, ''), 10);
    const expectedPrice = parseInt(expectedMatch[1].replace(/,/g, ''), 10);
    const diffMatch = text.match(/Expected change:?\s*([+\-]?₹?[0-9,]+)/i);
    const trendMatch = text.match(/Trend:?\s*([^.\n]+)/i);
    const forecastMatch = text.match(/Forecast:?\s*([^.\n]+)/i);

    const diff = expectedPrice - currentPrice;
    const isUp = diff > 0;

    // Filter out the structured lines from displaying as redundant text
    const cleanLines = text
      .split('\n')
      .filter((line) => {
        const lower = line.toLowerCase();
        return (
          !lower.includes('current price:') &&
          !lower.includes('expected price:') &&
          !lower.includes('expected change:') &&
          !lower.includes('forecast:')
        );
      })
      .join('\n');

    return {
      cleanText: cleanLines,
      card: {
        type: 'price_forecast',
        crop: 'Onion',
        icon: '🧅',
        currentPrice,
        expectedPrice,
        priceDiff: diff,
        unit: 'Quintal',
        trend: trendMatch ? trendMatch[1].trim() : isUp ? '↑ May Increase' : '↓ May Decrease',
        horizon: forecastMatch?.includes('7') ? 7 : 7,
        market: 'Ahmedabad APMC Mandi',
        note: 'AI forecast based on historical Ahmedabad APMC mandi data',
      },
    };
  }

  return { cleanText: text, card: null };
};

// Crop emoji helper
const getCropEmoji = (cropName: string): string => {
  const lower = cropName.toLowerCase();
  if (lower.includes('onion') || lower.includes('प्याज़') || lower.includes('ડુંગળી')) return '🧅';
  if (lower.includes('wheat') || lower.includes('गेहूँ') || lower.includes('ઘઉં')) return '🌾';
  if (lower.includes('cotton') || lower.includes('कपास') || lower.includes('કપાસ')) return '🌱';
  if (lower.includes('rice') || lower.includes('चावल') || lower.includes('ચોખા') || lower.includes('basmati')) return '🍚';
  if (lower.includes('potato') || lower.includes('आलू') || lower.includes('બટાકા')) return '🥔';
  if (lower.includes('mustard') || lower.includes('सरसों') || lower.includes('રાઈ')) return '🌼';
  return '🌿';
};

export const FormattedAIMessage: React.FC<FormattedAIMessageProps> = ({
  message,
  onNavigate,
  onActionClick,
  onRetry,
}) => {
  // If this is an error message
  if (message.isError || message.canRetry) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs">
          <span className="material-symbols-outlined text-[#DC2626] text-lg shrink-0 mt-0.5">
            info
          </span>
          <div className="space-y-1">
            <p className="font-semibold text-[#991B1B]">
              {message.text || "Sorry, I couldn't generate that answer right now. Please try again."}
            </p>
          </div>
        </div>

        {onRetry && (
          <div>
            <button
              onClick={() => onRetry(message.failedQuery)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#006c49] hover:bg-[#005237] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Try Again</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 1. Check for raw markdown table in text
  const { cleanText: textAfterTable, table: parsedTable } = extractMarkdownTable(message.text || '');

  // 2. Check for structured prediction block in text
  const { cleanText: finalText, card: parsedCard } = extractPredictionBlock(textAfterTable);

  // Determine active visual card (either explicit from payload or parsed from text)
  const visualCard = message.card || parsedCard;

  // Determine active table (either explicit from payload or parsed from text)
  const explicitTable = message.table;

  // Split text into paragraphs and lines
  const paragraphs = finalText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="space-y-3 text-xs leading-relaxed text-[#1F2937]">
      {/* Visual Response Card (Hero numerical insight: Crisp White Background, Strong Dark Text, Clean Green Accent) */}
      {visualCard && (
        <div className="rounded-xl p-3.5 bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs text-[#1F2937] my-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2.5 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{visualCard.icon || getCropEmoji(visualCard.crop)}</span>
              <div>
                <span className="font-bold text-sm text-[#1F2937] block leading-tight">
                  {visualCard.crop}
                </span>
                <span className="text-[11px] text-[#4B5563] font-medium">
                  {visualCard.market || 'Ahmedabad APMC Mandi'}
                </span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#006c49] border border-[#A7F3D0]">
              <span>✨</span>
              <span>AI Price Forecast</span>
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider block">
              Expected Market Price
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#1F2937] tracking-tight flex items-baseline gap-1">
              <span>₹{(visualCard.expectedPrice || visualCard.currentPrice || 0).toLocaleString('en-IN')}</span>
              <span className="text-xs font-semibold text-[#4B5563]">
                / {visualCard.unit || 'Quintal'}
              </span>
            </div>
          </div>

          {/* Trend & Change Details */}
          <div className="mt-2.5 pt-2 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                  (visualCard.priceDiff || 0) >= 0
                    ? 'bg-[#DCFCE7] text-[#166534]'
                    : 'bg-[#FEE2E2] text-[#991B1B]'
                }`}
              >
                <span>{(visualCard.priceDiff || 0) >= 0 ? '↑' : '↓'}</span>
                <span>{visualCard.trend || 'May Increase'}</span>
              </span>

              {visualCard.priceDiff !== undefined && visualCard.priceDiff !== 0 && (
                <span className="text-[11px] font-bold text-[#4B5563]">
                  ({visualCard.priceDiff > 0 ? '+' : ''}₹{Math.abs(visualCard.priceDiff).toLocaleString('en-IN')})
                </span>
              )}
            </div>

            {visualCard.currentPrice && visualCard.currentPrice !== visualCard.expectedPrice && (
              <span className="text-[11px] text-[#4B5563] font-medium">
                Today: <strong className="text-[#1F2937]">₹{visualCard.currentPrice.toLocaleString('en-IN')}</strong>
              </span>
            )}
          </div>

          {visualCard.note && (
            <p className="mt-2 text-[10px] text-[#4B5563] italic">
              {visualCard.note}
            </p>
          )}

          {/* Interactive Navigation to Price Prediction page */}
          {onNavigate && (
            <div className="mt-2.5 pt-2 border-t border-[#E5E7EB] flex justify-end">
              <button
                onClick={() => onNavigate('price-prediction')}
                className="text-[11px] font-bold text-[#006c49] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Price Forecast</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Explicit Mandi Price Table (Clean White Table, #E5E7EB borders, #1F2937 text) */}
      {explicitTable && explicitTable.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] my-2 bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#4B5563] font-bold text-[10px] uppercase tracking-wider border-b border-[#E5E7EB]">
                <th className="py-2 px-3">Crop</th>
                <th className="py-2 px-3 text-right">Market Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {explicitTable.map((row: ChatMandiTableRow, idx: number) => (
                <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[#1F2937] flex items-center gap-2">
                    <span className="text-base">{row.icon || getCropEmoji(row.crop)}</span>
                    <div>
                      <span>{row.crop}</span>
                      {row.market && (
                        <span className="text-[10px] text-[#4B5563] block font-normal">
                          {row.market}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="font-bold text-[#1F2937]">
                      ₹{typeof row.price === 'number' ? row.price.toLocaleString('en-IN') : row.price}
                    </span>
                    <span className="text-[10px] text-[#4B5563] ml-1 font-medium">
                      / {row.unit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Parsed Markdown Table (converted to HTML UI table, NO pipes, high contrast) */}
      {parsedTable && parsedTable.rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] my-2 bg-white shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            {parsedTable.headers.length > 0 && (
              <thead>
                <tr className="bg-[#F8FAFC] text-[#4B5563] font-bold text-[10px] uppercase tracking-wider border-b border-[#E5E7EB]">
                  {parsedTable.headers.map((h, idx) => (
                    <th key={idx} className={`py-2 px-3 ${idx === parsedTable.headers.length - 1 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-[#E5E7EB]">
              {parsedTable.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#F8FAFC] transition-colors">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={`py-2.5 px-3 ${
                        cIdx === 0
                          ? 'font-semibold text-[#1F2937]'
                          : cIdx === row.length - 1
                          ? 'font-bold text-[#1F2937] text-right'
                          : 'text-[#4B5563]'
                      }`}
                    >
                      {cIdx === 0 && (
                        <span className="mr-1.5 text-sm">{getCropEmoji(cell)}</span>
                      )}
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rendered Text Paragraphs (Clean typography, #1F2937 primary text, no asterisks, no raw markdown) */}
      <div className="space-y-2 text-[#1F2937]">
        {paragraphs.map((para, pIdx) => {
          // Check if paragraph is a list of items
          const lines = para.split('\n');
          const isList = lines.length > 1 && lines.every((l) => /^[0-9]+[\.\)]\s+|^\s*[-*•]\s+/.test(l.trim()));

          if (isList) {
            return (
              <ul key={pIdx} className="space-y-1.5 my-1.5 pl-1">
                {lines.map((line, lIdx) => {
                  const cleaned = line.replace(/^[0-9]+[\.\)]\s+|^\s*[-*•]\s+/, '').trim();
                  return (
                    <li key={lIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006c49] shrink-0 mt-1.5" />
                      <span className="flex-1 text-[#1F2937]">
                        {cleanInlineMarkdown(cleaned)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            );
          }

          // Single paragraph or mixed lines
          return (
            <div key={pIdx} className="space-y-1">
              {lines.map((line, lIdx) => {
                const trimmed = line.trim();
                if (!trimmed) return null;

                // If line starts with a list bullet
                if (/^[-*•]\s+/.test(trimmed)) {
                  const content = trimmed.replace(/^[-*•]\s+/, '');
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-1 my-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#006c49] shrink-0 mt-1.5" />
                      <span className="flex-1 text-[#1F2937]">{cleanInlineMarkdown(content)}</span>
                    </div>
                  );
                }

                // If line starts with number
                if (/^[0-9]+[\.\)]\s+/.test(trimmed)) {
                  const num = trimmed.match(/^[0-9]+/)?.[0];
                  const content = trimmed.replace(/^[0-9]+[\.\)]\s+/, '');
                  return (
                    <div key={lIdx} className="flex items-start gap-2 pl-1 my-0.5">
                      <span className="w-4 h-4 rounded-full bg-[#ECFDF5] text-[#006c49] border border-[#A7F3D0] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {num}
                      </span>
                      <span className="flex-1 text-[#1F2937]">{cleanInlineMarkdown(content)}</span>
                    </div>
                  );
                }

                return (
                  <p key={lIdx} className="leading-relaxed text-[#1F2937]">
                    {cleanInlineMarkdown(trimmed)}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Suggested Follow-up Actions (Clickable Chips: #F1F5F9 background, #374151 text, #D1D5DB border) */}
      {message.suggestedActions && message.suggestedActions.length > 0 && onActionClick && (
        <div className="pt-2 border-t border-[#E5E7EB] flex flex-wrap gap-1.5">
          {message.suggestedActions.map((action, aIdx) => (
            <button
              key={aIdx}
              onClick={() => onActionClick(action)}
              className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] hover:bg-[#E8F5EF] hover:text-[#006c49] text-[#374151] text-[11px] font-semibold border border-[#D1D5DB] transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>{action}</span>
              <span className="material-symbols-outlined text-xs text-[#006c49]">arrow_forward</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
