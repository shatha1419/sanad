export interface AnalysisCriterion {
  passed: boolean;
  confidence: number;
  details: string;
}

export interface Analysis {
  face_visible: AnalysisCriterion;
  face_size?: AnalysisCriterion;
  face_centered?: AnalysisCriterion;
  shoulders_visible?: AnalysisCriterion;
  head_straight: AnalysisCriterion;
  lighting: AnalysisCriterion;
  background: AnalysisCriterion;
  no_glasses: AnalysisCriterion;
  neutral_expression: AnalysisCriterion;
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

export const CRITERIA_LABELS: Record<string, string> = {
  face_visible: 'الوجه واضح',
  face_size: 'حجم الوجه (70-80%)',
  face_centered: 'الوجه في المنتصف',
  shoulders_visible: 'الأكتاف مرئية',
  head_straight: 'الرأس مستقيم',
  lighting: 'الإضاءة',
  background: 'الخلفية بيضاء',
  no_glasses: 'بدون نظارات',
  neutral_expression: 'تعبير محايد',
  proper_crop: 'أبعاد 4:6',
  not_ai_generated: 'صورة حقيقية'
};

export interface PhotoAnalysis {
  id: string;
  user_id: string;
  original_image_url: string | null;
  edited_image_url: string | null;
  analysis_result: AnalysisResult;
  verdict: string;
  overall_confidence: number;
  created_at: string;
}
