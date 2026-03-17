# Visit Oman project: Discover & Plan

A comprehensive tourism platform that combines a modern discovery experience with an intelligent itinerary generator. Built for the **CODESTACKER 2026 Frontend Development Challenge**, aligned with **Oman Vision 2040**.

---

## 📌 Overview

This platform addresses key tourism challenges in Oman:

- **Poor Planning** → Unrealistic travel routes and missed seasonal attractions  
- **Regional Imbalance** → Overcrowding in popular areas while others are ignored  
- **Short Stays** → Visitors miss the full diversity of Oman  

### 🎯 Solution Impact

- ✅ Distributes tourists across multiple regions  
- ✅ Increases average stay duration  
- ✅ Promotes local businesses across Oman  
- ✅ Reduces travel friction through smart planning  
- ✅ Enhances Oman’s global tourism competitiveness  

---

## ✨ Features

### 🟢 Part 1: Marketing Experience (SSR)

#### 1. Landing Page
- Hero section introducing Oman tourism  
- Category exploration (mountain, beach, culture, desert, nature, food)  
- Featured destinations dynamically loaded from dataset  
- Clear CTA → **Plan Your Trip**

#### 2. Destination Browsing
- Grid view of all destinations  
- Filter by:
  - Category  
  - Region  
  - Season  
- Sort by:
  - Crowd level  
  - Cost  
- URL-based filters (shareable & reloadable)

#### 3. Destination Details
- Generated description  
- Recommended months visualization  
- Crowd level indicator (1–5)  
- Estimated visit duration  
- Location preview (coordinates-based)

#### 4. Save Interests
- LocalStorage persistence  
- Cross-page state retention  
- Automatically used in planner  

---

### 🔵 Part 2: Intelligent Itinerary Generator (CSR)

#### 1. User Inputs
- Trip duration: **1–7 days**  
- Budget: **low | medium | luxury**  
- Travel month: **1–12**  
- Travel intensity:
  - relaxed  
  - balanced  
  - packed  
- Preferred categories (from saved interests)

---

#### 2. Generated Itinerary
- Region allocation strategy  
- Day-by-day plan  
- Route optimization using **2-opt algorithm**  
- Cost breakdown:
  - fuel  
  - tickets  
  - food  
  - accommodation  
- Explanation panel for each stop  

---

#### 🌍 Bilingual Support
- English 🇬🇧  
- Arabic 🇸🇦 (RTL supported)

---

## 🏗️ Architecture

### Rendering Strategy

| Layer | Pages |
|------|------|
| **SSR (Server-Side Rendering)** | Landing, Destinations, Details |
| **CSR (Client-Side Rendering)** | Planner |

### State Management

- Zustand (with persistence)
- LocalStorage (saved interests + itinerary)
- URL parameters (filters)

---

## 🧠 Itinerary Generation Algorithm

### Multi-Objective Scoring Model

score(i) =
  w_interest  * InterestMatch(i)
+ w_season    * SeasonFit(i)
- w_crowd     * CrowdPenalty(i)
- w_cost      * CostPenalty(i)
- w_detour    * DetourPenalty(i)
+ w_diversity * DiversityGain(i)

---

### ⚖️ Weight Configuration

| Weight | Value | Reason |
|------|------|------|
| Interest | 0.25 | User preference priority |
| Season | 0.20 | Critical for Oman climate |
| Crowd | 0.15 | Avoid overcrowding |
| Cost | 0.15 | Budget awareness |
| Detour | 0.15 | Route efficiency |
| Diversity | 0.10 | Variety in experience |

---

### 📊 Normalization

All values scaled to **[0,1]**

- Jaccard → direct  
- Season → exact (1), adjacent (0.5), else (0)  
- Crowd → inverted scale  
- Cost → relative to max  
- Detour → distance-based  
- Diversity → category spread  

---

### 🗺️ Planning Phases

#### Phase A: Region Allocation
- Minimum 2 regions (if ≥3 days)
- Max `ceil(days/2)` per region
- Season-aware selection
- Geographic ordering

#### Phase B: Routing
- Max 250 km/day  
- Max 8 hours/day  
- Category diversity  
- Rest gap rule  
- Stops based on intensity  

---

### 🔄 Optimization

- Initial route → nearest neighbor  
- Improved using **2-opt algorithm**  
- Ensures better route efficiency  

---

### 💰 Cost Calculation

- fuel = total_km / 12 × 0.25
- tickets = sum(ticket_cost)
- food = 6 × days
- hotel = nights × tier_price

#### Budget thresholds:
- Low → 150 OMR  
- Medium → 400 OMR  
- Luxury → 800 OMR  

If exceeded:
- Reduce expensive stops  
- Favor cheaper alternatives  
- Maintain diversity  

---

## ⚙️ Project Setup

### Requirements
- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/Noursaidd/visit-oman-project.git
cd visit-oman-project
npm install
npm run dev

```
**### open**
```
http://localhost:3000

```
### Scripts

```
npm run dev      
npm run build    
npm run lint     
```

## File Structure

src/
 ├── app/
 ├── components/
 ├── data/
 ├── hooks/
 ├── lib/
 │    └── planner/
 ├── store/
 └── types/
 
 *Supporting sustainable tourism development and economic diversification in the Sultanate of Oman.*
