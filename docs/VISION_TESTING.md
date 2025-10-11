# Vision-Based Rack Analysis Testing Guide

## 🚀 Quick Start

### Test with a ModularGrid Screenshot

1. **Get a screenshot**:
   - Visit any ModularGrid rack (e.g., https://modulargrid.net/e/racks/view/2383104)
   - Take a screenshot of the rack image
   - Save as `test-rack.jpg` or `test-rack.png`

2. **Test the vision endpoint**:
```bash
# Basic analysis (just identify modules)
curl -X POST http://localhost:3000/api/vision/analyze-rack \
  -F "image=@test-rack.jpg"

# With enrichment (find full specs for each module)
curl -X POST http://localhost:3000/api/vision/analyze-rack \
  -F "image=@test-rack.jpg" \
  -F "enrich=true"
```

3. **Expected output**:
```json
{
  "success": true,
  "timing": {
    "visionAnalysis": "3.45s",
    "enrichment": "12.30s",
    "total": "15.75s"
  },
  "visionAnalysis": {
    "modules": [
      {
        "name": "Plaits",
        "manufacturer": "Mutable Instruments",
        "position": { "x": 0.1, "y": 0.0, "width": 12 },
        "confidence": 0.95,
        "notes": "Macro oscillator with multiple synthesis modes"
      },
      ...
    ],
    "rackLayout": {
      "rows": 2,
      "estimatedHP": 104,
      "case": "Intellijel 7U Performance Case"
    },
    "overallQuality": "excellent"
  },
  "enrichedModules": [
    {
      "module": {
        "name": "Plaits",
        "manufacturer": "Mutable Instruments",
        "type": "VCO",
        "hp": 12,
        "power": { "positive12V": 60, "negative12V": 5 },
        "inputs": [...],
        "outputs": [...]
      },
      "sources": ["https://mutable-instruments.net/..."],
      "confidence": 0.95
    }
  ]
}
```

## 🧪 Testing Strategy

### Phase 1: Vision Recognition Accuracy
Test Claude Vision's ability to identify modules:

**Test Cases**:
1. **Clear, high-res rack photo** → Expect >90% confidence
2. **Angled/perspective photo** → Expect >70% confidence
3. **Low resolution** → Expect >50% confidence
4. **Multiple rows** → Test position detection
5. **Obscured modules** → Test partial identification

### Phase 2: Module Enrichment Accuracy
Test web search + AI specs extraction:

**Test Cases**:
1. **Popular modules** (Maths, Plaits) → Expect 100% success
2. **Obscure modules** → Expect 60-80% success
3. **Custom/DIY modules** → Expect manual review flag
4. **Misidentified modules** → Test error handling

### Phase 3: End-to-End Pipeline
Test full workflow:

```bash
# 1. Upload image
# 2. Identify modules
# 3. Enrich specifications
# 4. Save to database
# 5. Generate patch

curl -X POST http://localhost:3000/api/vision/analyze-rack \
  -F "image=@my-rack.jpg" \
  -F "enrich=true" \
  -F "generatePatch=true" \
  -F "intent=ambient drone"
```

## 📊 Success Metrics

### Vision Analysis:
- **Module Detection Rate**: >80% of visible modules identified
- **Confidence Score**: Average >0.7
- **Position Accuracy**: Within 10% of actual position
- **HP Estimation**: Within ±2 HP of actual

### Enrichment:
- **Spec Retrieval**: >90% for popular modules
- **Data Completeness**: HP + power + I/O for >80%
- **Source Quality**: Manufacturer or ModularGrid URL for >70%

### Performance:
- **Vision Analysis**: <5 seconds
- **Enrichment per module**: <2 seconds
- **Total pipeline** (10 modules): <25 seconds

## 🔍 Manual Testing Checklist

### Test Different Rack Types:
- [ ] Single row Eurorack
- [ ] Multi-row Eurorack (2-4 rows)
- [ ] Large system (84HP+)
- [ ] Small system (<42HP)
- [ ] Intellijel 7U (with 1U tiles)
- [ ] Different case manufacturers

### Test Image Quality:
- [ ] Professional product photo
- [ ] User smartphone photo
- [ ] Screenshot from ModularGrid
- [ ] Angled/perspective view
- [ ] Partial rack (zoomed in)
- [ ] With cables connected
- [ ] Without cables

### Test Module Variety:
- [ ] Popular modules (>1000 users)
- [ ] Boutique modules (<100 users)
- [ ] DIY modules
- [ ] Vintage modules
- [ ] New releases (2024+)
- [ ] Discontinued modules

## 🐛 Known Issues & Limitations

### Current Limitations:
1. **Obscured modules**: If partially hidden, may not identify
2. **Generic modules**: Similar-looking modules may confuse AI
3. **Label quality**: Poor text on faceplate reduces accuracy
4. **Lighting**: Dark/shadowed photos reduce confidence
5. **Enrichment speed**: Sequential web searches = slow for large racks

### Future Improvements:
1. **Batch enrichment**: Parallel module lookups
2. **Database caching**: Skip enrichment for known modules
3. **User feedback**: "Is this correct?" → improve model
4. **OCR enhancement**: Dedicated text recognition for labels
5. **Confidence thresholds**: Flag low-confidence for manual review

## 💰 Cost Analysis

### Vision API Costs (Claude 3.5 Sonnet):
- Input: $3 per 1M tokens (~1500 tokens per image = $0.0045)
- Output: $15 per 1M tokens (~1000 tokens response = $0.015)
- **Cost per rack analysis: ~$0.02**

### Enrichment Costs:
- Web search: Free (using Claude's web search)
- AI parsing: $0.01-0.05 per module
- **Cost per module enrichment: ~$0.03**

### Total Cost Example:
- 10-module rack: $0.02 (vision) + $0.30 (enrichment) = **$0.32 total**
- 100 racks/day: $32/day = **$960/month**
- With caching (80% hit rate): **$192/month**

### Optimization Strategies:
1. **Cache enriched modules** → 80-90% cost reduction
2. **Use Haiku for re-analysis** → 10x cheaper for updates
3. **Batch processing** → Better throughput
4. **Community contributions** → Manual module additions

## 🎯 Next Steps

### Immediate:
1. Test with 5-10 different rack images
2. Measure accuracy metrics
3. Identify common failure modes
4. Optimize vision prompts

### Short-term:
1. Build module database schema (Cosmos DB)
2. Implement caching layer
3. Add confidence threshold logic
4. Create manual review workflow

### Medium-term:
1. Build web UI for upload
2. Show visual feedback (bounding boxes on modules)
3. Interactive correction ("This is actually...")
4. Community validation system

---

**Ready to test?** Grab a ModularGrid screenshot and let's see the magic! 🎸✨
