# AgricProducer 🌾🚜

**AgricProducer** is a premium, modern dashboard designed for European agricultural producers to manage their operations with precision and ease. Built with a focus on visual excellence and active management, it transforms farm data into actionable insights through an intuitive interface and an integrated AI assistant.

![Dashboard Preview](https://github.com/mbanefonnoli/AgricProducer/raw/main/public/preview.png) *(Placeholder: Add your actual preview image here)*

## 🚀 Key Features

- **📦 Inventory Hub**: Real-time stock tracking with support for unit variants (kg, liters, units) and integrated pricing (buying/selling cost) to monitor total stock value.
- **👥 Client CRM**: Manage buyer relationships, track contact details, and link financial transactions directly to specific clients.
- **💰 Financial Hub**: Monitor profit and loss with automated income/expense logging. High-level summaries provide a quick glance at the farm's financial health.
- **📋 Task Manager**: A team-oriented task system allowing owners to create, assign, and track progress across the staff.
- **📁 Document Repository**: Centralized storage for contracts, lab results, and invoices, with secure upload and retrieval.
- **🤖 AI Assistant**: A DeepSeek-powered AI integrated directly into the dashboard. It can:
  - "Show me overdue tasks"
  - "Log a harvest of 500kg of tomatoes"
  - "Summarize my finances for this month"
  - "Create a task for John to check the irrigation"

## 🛠️ Tech Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/) & DeepSeek
- **Components**: Radix UI & Custom Premium Design System

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/mbanefonnoli/AgricProducer.git
cd AgricProducer
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root and add your Supabase and DeepSeek credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### 4. Database Setup
Run the SQL migrations located in `supabase/migrations/` in your Supabase SQL Editor, starting from `0000_initial_schema.sql` to `0005_consolidated_cleanup.sql`.

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📄 License
This project is licensed under the MIT License.
