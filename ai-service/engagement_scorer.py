class EngagementScorer:
    def __init__(self):
        self.history = []
        
    def compute(self, attention, valence, interaction):
        # Applies formula: 0.45xAttention + 0.35xValence + 0.20xInteraction x 100
        attention_val = 1.0 if attention else 0.0
        score = (0.45 * attention_val + 0.35 * valence + 0.20 * interaction) * 100
        return score
        
    def aggregate_window(self, frames_data):
        # Aggregates 30 seconds of frames into one score + state
        if not frames_data:
            return {"score": 0, "state": "unknown"}
            
        total_score = sum(self.compute(f['attention'], f['valence'], f['interaction']) for f in frames_data)
        avg_score = total_score / len(frames_data)
        
        if avg_score > 70:
            state = "Highly Engaged"
        elif avg_score > 40:
            state = "Engaged"
        else:
            state = "Distracted"
            
        return {"score": avg_score, "state": state}
