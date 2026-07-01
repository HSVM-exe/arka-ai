import type { ModelMetric } from '../types';

export interface EvaluationMetrics {
  summaryMetrics: ModelMetric[];
  confusionMatrix: {
    tp: number;
    fp: number;
    fn: number;
    tn: number;
  };
  rocPoints: { fpr: number; tpr: number }[];
  prPoints: { recall: number; precision: number }[];
  calibrationPoints: { forecastProb: number; actualRatio: number }[];
  leadTimeDistribution: { bin: string; count: number }[];
}

export const getModelEvaluationMetrics = (): EvaluationMetrics => {
  return {
    summaryMetrics: [
      { metric: 'True Positive Rate (Recall)', value: '91.5%', purpose: 'Fraction of actual flares predicted successfully' },
      { metric: 'Precision', value: '89.2%', purpose: 'Fraction of predicted flares that were actual events' },
      { metric: 'F1 Score', value: '0.903', purpose: 'Harmonic mean of precision and recall' },
      { metric: 'ROC-AUC', value: '0.942', purpose: 'Overall separator performance of positive vs negative cases' },
      { metric: 'PR-AUC', value: '0.884', purpose: 'Critical evaluation metric for highly imbalanced solar data' },
      { metric: 'Brier Score', value: '0.038', purpose: 'Probability calibration quality (closer to 0 is better)' },
      { metric: 'Mean Lead Time', value: '14.2 min', purpose: 'Average warnings delivered before flare peak' },
      { metric: 'False Alarm Rate', value: '3.1 / day', purpose: 'Frequency of incorrect warnings generated per 24 hours' },
      { metric: 'Missed Event Rate', value: '8.5%', purpose: 'Operational safety indicator (uncaught flares)' }
    ],
    confusionMatrix: {
      tp: 91, // True Positives
      fp: 11, // False Positives
      fn: 9,  // False Negatives
      tn: 889 // True Negatives (Quiet solar days)
    },
    // ROC Curve points
    rocPoints: [
      { fpr: 0, tpr: 0 },
      { fpr: 0.02, tpr: 0.4 },
      { fpr: 0.05, tpr: 0.72 },
      { fpr: 0.1, tpr: 0.88 },
      { fpr: 0.15, tpr: 0.915 },
      { fpr: 0.25, tpr: 0.95 },
      { fpr: 0.5, tpr: 0.98 },
      { fpr: 0.75, tpr: 0.99 },
      { fpr: 1.0, tpr: 1.0 }
    ],
    // Precision-Recall Curve points
    prPoints: [
      { recall: 0, precision: 1.0 },
      { recall: 0.2, precision: 0.98 },
      { recall: 0.4, precision: 0.96 },
      { recall: 0.6, precision: 0.93 },
      { recall: 0.8, precision: 0.91 },
      { recall: 0.915, precision: 0.892 },
      { recall: 0.95, precision: 0.76 },
      { recall: 0.98, precision: 0.45 },
      { recall: 1.0, precision: 0.1 }
    ],
    // Calibration curve (ideal diagonal represents perfect calibration)
    calibrationPoints: [
      { forecastProb: 0, actualRatio: 0 },
      { forecastProb: 10, actualRatio: 8 },
      { forecastProb: 20, actualRatio: 22 },
      { forecastProb: 30, actualRatio: 28 },
      { forecastProb: 40, actualRatio: 42 },
      { forecastProb: 50, actualRatio: 49 },
      { forecastProb: 60, actualRatio: 61 },
      { forecastProb: 70, actualRatio: 72 },
      { forecastProb: 80, actualRatio: 78 },
      { forecastProb: 90, actualRatio: 89 },
      { forecastProb: 100, actualRatio: 98 }
    ],
    // Lead time histogram bins
    leadTimeDistribution: [
      { bin: '0-5 min', count: 8 },
      { bin: '5-10 min', count: 18 },
      { bin: '10-15 min', count: 35 },
      { bin: '15-20 min', count: 22 },
      { bin: '20-25 min', count: 12 },
      { bin: '25-30 min', count: 5 },
      { bin: '30+ min', count: 2 }
    ]
  };
};
export type { EvaluationMetrics as EvaluationMetricsType };
