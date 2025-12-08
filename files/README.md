# BTM Reise-Manager – Stripe Integration

Diese Dateien aktualisieren den BTM Reise-Manager von der eigenen PayPal-Integration auf **Stripe Checkout** mit Unterstützung für Karte, PayPal, Apple Pay, Google Pay und weitere Zahlungsmethoden.

---

## 📁 Enthaltene Dateien

```
├── app/
│   └── api/
│       └── stripe/
│           ├── create-checkout-session/
│           │   └── route.ts          # Erstellt Stripe Checkout Session
│           └── verify-session/
│               └── route.ts          # Verifiziert erfolgreiche Zahlung
├── public/
│   └── btm-app.html                  # Aktualisierte App mit Stripe
├── package.json                       # Mit Stripe-Dependency
├── .env.local.example                 # Vorlage für Umgebungsvariablen
└── MIGRATION_GUIDE.md                 # Detaillierte Änderungsdokumentation
```

---

## 🚀 Installationsanleitung

### 1. Stripe Secret Key holen

1. Gehe zu [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys)
2. Kopiere deinen **Secret Key** (beginnt mit `sk_live_...`)

### 2. Dateien in dein Projekt kopieren

```bash
# API Routes kopieren
cp -r app/api/stripe /pfad/zu/deinem/projekt/app/api/

# btm-app.html ersetzen
cp public/btm-app.html /pfad/zu/deinem/projekt/public/
```

### 3. Stripe installieren

```bash
npm install stripe
```

### 4. Umgebungsvariablen setzen

#### Lokal (.env.local)
```env
STRIPE_SECRET_KEY=sk_live_DEIN_SECRET_KEY
NEXT_PUBLIC_BASE_URL=https://reise.nevpaz.de
```

#### In Vercel
1. Gehe zu deinem Projekt → Settings → Environment Variables
2. Füge hinzu:
   - `STRIPE_SECRET_KEY` = `sk_live_...`
   - `NEXT_PUBLIC_BASE_URL` = `https://reise.nevpaz.de`

### 5. Deployen

```bash
git add .
git commit -m "Umstellung auf Stripe Checkout"
git push
```

Vercel deployed automatisch.

---

## ✅ Was sich geändert hat

| Vorher (PayPal)                     | Nachher (Stripe)                          |
|-------------------------------------|-------------------------------------------|
| PayPal SDK im Frontend              | Stripe Checkout (hosted)                  |
| Eigene PayPal API-Routes            | Stripe API-Routes                         |
| Nur PayPal als Zahlungsmethode      | Karte, PayPal, Apple Pay, Google Pay, etc.|
| Manuelle Verifizierung              | Automatische Verifizierung via Session ID |

---

## 🔒 Sicherheit

- **Serverseitige Verifizierung**: Jede Zahlung wird nach dem Redirect serverseitig bei Stripe verifiziert
- **Keine sensiblen Daten im Frontend**: Der Secret Key bleibt auf dem Server
- **PCI-DSS Compliance**: Stripe übernimmt die Kartenverarbeitung

---

## 🧪 Testen

1. Verwende den **Test-Modus** in Stripe (Secret Key beginnt mit `sk_test_...`)
2. Testkartennummer: `4242 4242 4242 4242`
3. Beliebiges Ablaufdatum in der Zukunft
4. Beliebige CVC

---

## 📞 Support

Bei Fragen: info@nevpaz.de
