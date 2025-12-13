export interface AnalysisCriterion {
  passed: boolean;
  confidence: number;
  details: string;
}

export interface Analysis {
  face_visible: AnalysisCriterion;
  lighting: AnalysisCriterion;
  background: AnalysisCriterion;
  no_glasses: AnalysisCriterion;
  neutral_expression: AnalysisCriterion;
  head_straight: AnalysisCriterion;
  proper_crop: AnalysisCriterion;
  not_ai_generated: AnalysisCriterion;
}

export interface SuggestedFix {
  type: string;
  description: string;
  auto_fixable: boolean;
}

export interface AnalysisResult {
  analysis: Analysis;
  reasoning_trace: string[];
  suggested_fixes: SuggestedFix[];
  user_actions_required: string[];
  overall_confidence: number;
  verdict: 'APPROVED' | 'FIXABLE' | 'NEEDS_USER_ACTION' | 'REJECTED';
}

export type AgentStep = 
  | 'upload' 
  | 'analyzing' 
  | 'reasoning' 
  | 'decision' 
  | 'applying' 
  | 'comparing' 
  | 'final';

export const CRITERIA_LABELS: Record<keyof Analysis, string> = {
  face_visible: 'الوجه واضح',
  lighting: 'الإضاءة',
  background: 'الخلفية',
  no_glasses: 'بدون نظارات',
  neutral_expression: 'تعبير محايد',
  head_straight: 'الرأس مستقيم',
  proper_crop: 'حجم مناسب',
  not_ai_generated: 'صورة حقيقية'
};
