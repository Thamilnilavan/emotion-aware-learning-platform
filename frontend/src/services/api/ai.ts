import api from '@/lib/axios';


export interface AIAnalysisResult {
  session_id: string;
  timestamp: number | null;
  face_detection: any;
  emotion: any;
  eye_gaze: any;
  head_pose: any;
  attention: any;
  engagement: any;
  intervention: any;
}

export interface AISessionAnalysis {
  session_id: string;
  summary: any;
  timeline: any[];
  engagement_analysis: any;
  interventions: any[];
}

export const aiService = {
  /**
   * Analyze a single frame through AI services
   */
  async analyzeFrame(image: string, sessionId?: string, timestamp?: number): Promise<AIAnalysisResult> {
    try {
      const response = await api.post(`/ai/analyze-frame`, {
        image,
        session_id: sessionId,
        timestamp
      });
      return response.data.data;
    } catch (error) {
      console.error('Frame analysis error:', error);
      throw error;
    }
  },

  /**
   * Analyze a complete session through AI services
   */
  async analyzeSession(
    sessionId: string,
    images: string[],
    timestamps?: number[],
    duration?: number
  ): Promise<AISessionAnalysis> {
    try {
      const response = await api.post(`/ai/analyze-session`, {
        session_id: sessionId,
        images,
        timestamps,
        duration
      });
      return response.data.data;
    } catch (error) {
      console.error('Session analysis error:', error);
      throw error;
    }
  },

  /**
   * Check AI services health
   */
  async checkHealth(): Promise<any> {
    try {
      const response = await api.get(`/ai/health`);
      return response.data.data;
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  },

  /**
   * Get AI service status
   */
  async getServiceStatus(): Promise<any> {
    try {
      const response = await api.get(`/ai/status`);
      return response.data.data;
    } catch (error) {
      console.error('Service status error:', error);
      throw error;
    }
  },

  /**
   * Detect emotion from image
   */
  async detectEmotion(image: string, returnAllScores = true): Promise<any> {
    try {
      const response = await api.post(`/ai/detect-emotion`, {
        image,
        return_all_scores: returnAllScores
      });
      return response.data.data;
    } catch (error) {
      console.error('Emotion detection error:', error);
      throw error;
    }
  },

  /**
   * Detect faces in image
   */
  async detectFaces(image: string, returnLandmarks = false): Promise<any> {
    try {
      const response = await api.post(`/ai/detect-faces`, {
        image,
        return_landmarks: returnLandmarks
      });
      return response.data.data;
    } catch (error) {
      console.error('Face detection error:', error);
      throw error;
    }
  },

  /**
   * Calculate engagement score
   */
  async calculateEngagement(sessionData: any, duration: number): Promise<any> {
    try {
      const response = await api.post(`/ai/calculate-engagement`, {
        session_data: sessionData,
        duration
      });
      return response.data.data;
    } catch (error) {
      console.error('Engagement calculation error:', error);
      throw error;
    }
  },

  /**
   * Generate adaptive intervention
   */
  async generateIntervention(data: {
    attention_score: number;
    engagement_score: number;
    emotion: string;
    emotion_confidence: number;
    fatigue_level: number;
    session_duration: number;
    recent_interventions: string[];
  }): Promise<any> {
    try {
      const response = await api.post(`/ai/generate-intervention`, data);
      return response.data.data;
    } catch (error) {
      console.error('Intervention generation error:', error);
      throw error;
    }
  }
};

export default aiService;
