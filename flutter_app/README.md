# VertexIS Mobile (The Marsh Bites — Flutter Application)

A cross-platform Flutter mobile & tablet application for **The Marsh Bites** franchise branch managers and staff.

---

## 🚀 Features

### Branch (Client Account)
- **Dashboard** — Personal stats: sales, pending orders, inventory; announcements feed
- **Orders** — Place product packages and excess flavor orders; upload payment receipts
- **Inventory** — View current stock levels with low-stock warnings
- **Sales** — Record sales, view history and total revenue
- **Calendar** — View scheduled events, branch audits, and commissary holidays

### Admin (Super Admin)
- **Dashboard** — High-level overview: total branches, pending approvals, revenue, products
- **Orders** — View all orders from all branches; filter by status; approve/reject with reason
- **Branches** — Manage all branches; add new branch + manager account
- **Menu** — Add, edit, delete products (auto-syncs to all branches)
- **Announcements** — Publish announcements visible to all branches instantly

---

## 🏗️ Architecture

```
flutter_app/
├── lib/
│   ├── main.dart                          # App entry point
│   ├── models/
│   │   └── models.dart                    # All data models
│   ├── services/
│   │   └── data_service.dart              # Central state + SharedPreferences persistence
│   ├── utils/
│   │   └── theme.dart                     # Dark theme + color constants
│   ├── widgets/
│   │   └── shared_widgets.dart            # Reusable UI components
│   └── screens/
│       ├── auth/
│       │   └── login_screen.dart          # Login with role detection
│       ├── admin/
│       │   ├── admin_shell.dart           # Nav rail (desktop) / bottom nav (mobile)
│       │   ├── admin_dashboard.dart       # Stats + sales chart
│       │   ├── admin_orders.dart          # All orders + approve/reject
│       │   ├── admin_branches.dart        # Branch management
│       │   ├── admin_menu.dart            # Product CRUD
│       │   ├── admin_announcements.dart   # Publish announcements
│       └── branch/
│           ├── branch_shell.dart          # Bottom navigation
│           ├── branch_dashboard.dart      # Stats + announcements feed
│           ├── branch_orders.dart         # Create orders + upload payment
│           ├── branch_inventory.dart      # Stock view
│           ├── branch_sales.dart          # Record sales + history
│           └── branch_calendar.dart       # Event calendar
```

---

## ⚙️ Setup & Running

### Prerequisites
- Flutter SDK ≥ 3.10.0
- Dart ≥ 3.0.0

### Run

```bash
cd flutter_app

# Install dependencies
flutter pub get

# Run on connected device / emulator
flutter run

# Build Android APK
flutter build apk --release
```
