# 🛡️ Hallow

**Continuous, privacy-first authentication powered by on-device behavioral biometrics.**

> 🚧 **Status: Actively under development.**
> The core behavioral capture pipeline, ML components, and browser extension are currently being developed. Hallow is **not production-ready yet**.

Hallow is a browser-based security system that continuously analyzes **how a user interacts with their device** — including typing rhythm, mouse movement, and scrolling behavior — to establish a behavioral profile.

Instead of relying only on authentication at login, Hallow aims to provide a **continuous authentication layer** that can detect significant changes in interaction patterns throughout an active session.

> **Authenticate not only by who you are, but by how you behave.**

---

## 🚀 Why Hallow?

Traditional authentication verifies a user's identity when they log in. Once authenticated, however, the session may remain trusted until logout, timeout, or another security event.

This creates a security gap where threats such as **session hijacking, stolen devices, and unauthorized account access** can occur.

Hallow explores a different approach:

```text
Login
  ↓
Continuous Behavioral Monitoring
  ↓
Behavioral Analysis
  ↓
Anomaly Detection
  ↓
Security Response
```

### Key Goals

* 🔒 **Privacy-first** — behavioral processing is designed to run locally on the user's device.
* ⚡ **Continuous monitoring** — interaction patterns can be evaluated throughout an active session.
* 🧠 **Personalized profile** — the system learns patterns associated with the legitimate user.
* 🧩 **Low-friction authentication** — designed to work passively without repeatedly interrupting the user.
* 🛡️ **Security-focused** — behavioral deviations can be used as an additional signal for detecting unauthorized access.

---

## 🧠 Behavioral Signals

Hallow focuses on interaction characteristics rather than the actual content entered by the user.

### ⌨️ Keystroke Dynamics

Potential signals include:

* Key press duration
* Time between keystrokes
* Typing rhythm
* Typing speed
* Timing consistency

### 🖱️ Mouse Behavior

Potential signals include:

* Mouse velocity
* Acceleration
* Movement patterns
* Direction changes
* Click behavior

### 📜 Scrolling Behavior

Potential signals include:

* Scroll velocity
* Scroll frequency
* Scroll direction
* Scroll intervals
* Interaction cadence

These signals can be combined to create a behavioral representation of the user.

---

## 🏗️ How Hallow Works

```text
┌─────────────────────────┐
│     User Interaction   │
│ Keyboard / Mouse /     │
│        Scroll          │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Signal Collection    │
│ Behavioral events      │
│ captured locally       │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Feature Extraction   │
│ Convert events into     │
│ behavioral features     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Behavioral Baseline    │
│ User-specific profile  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│      ML Inference      │
│      TensorFlow.js     │
│       On-device        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Anomaly Detection    │
│ Compare live behavior  │
│ against baseline       │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    Security Response   │
│ Alert / Flag / Log     │
└─────────────────────────┘
```

### 1. Capture

Hallow observes relevant interaction signals such as typing dynamics, mouse movement, and scrolling patterns.

### 2. Feature Extraction

Raw interaction events are transformed into behavioral features suitable for analysis.

### 3. Learn

The system builds a behavioral baseline representing the user's normal interaction patterns.

### 4. Monitor

New interaction data is continuously compared against the established baseline.

### 5. Detect

Significant deviations can be classified as potential behavioral anomalies.

### 6. Respond

Detected anomalies can eventually trigger configurable security actions such as alerts, session warnings, or local logging.

---

## 🔐 Privacy by Design

Privacy is a core principle of Hallow.

The intended architecture keeps behavioral processing **on-device wherever technically possible**.

```text
             USER
               │
               ▼
      ┌─────────────────┐
      │ Browser / Hallow│
      │    Extension    │
      └────────┬────────┘
               │
               ▼
      ┌─────────────────┐
      │ Behavioral      │
      │ Capture         │
      └────────┬────────┘
               │
               ▼
      ┌─────────────────┐
      │ Feature         │
      │ Extraction      │
      └────────┬────────┘
               │
               ▼
      ┌─────────────────┐
      │ Local ML Model  │
      └────────┬────────┘
               │
               ▼
      ┌─────────────────┐
      │ Anomaly Score   │
      └─────────────────┘
```

The intended design avoids sending raw behavioral interaction data to a remote server.

> **Hallow is designed around local processing and data minimization.**

---

## 🛠️ Tech Stack

| Layer              | Technology                     |
| ------------------ | ------------------------------ |
| Browser Extension  | Chrome Extension API           |
| Extension Standard | Manifest V3                    |
| Frontend           | React                          |
| Machine Learning   | TensorFlow.js                  |
| ML Execution       | On-device                      |
| Backend            | Node.js *(optional/companion)* |
| Language           | JavaScript                     |

---

## 📁 Project Structure

The project is organized around the Hallow browser extension and its supporting components.

```text
hallow/
│
├── hallow-backend/
│
├── hallow-extension/
│
├── src/
│
├── public/
│
├── manifest.json
├── package.json
├── README.md
└── ...
```

> The project structure may evolve as development continues.

---

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/MettuShritan/Hallow.git
cd Hallow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the project

```bash
npm run build
```

### 4. Load the extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the generated `dist/` directory

> Build commands and extension paths may change as the project develops.

---

## 🧪 Current Development Status

Hallow is currently an experimental cybersecurity project.

### Completed

* [x] Initial project architecture
* [x] Browser extension foundation
* [x] Behavioral interaction capture
* [x] Keystroke signal collection
* [x] Mouse signal collection
* [x] Scroll signal collection

### In Progress

* [ ] Behavioral feature engineering
* [ ] TensorFlow.js anomaly detection model
* [ ] User behavioral baseline generation
* [ ] Real-time behavioral scoring
* [ ] Detection threshold calibration

### Planned

* [ ] Configurable sensitivity
* [ ] Per-domain security policies
* [ ] Multi-signal behavioral fusion
* [ ] Local anomaly history
* [ ] Security alerts
* [ ] Model adaptation
* [ ] Performance optimization
* [ ] Chrome Web Store release

---

## 🗺️ Roadmap

```text
Behavior Capture
       ↓
Feature Engineering
       ↓
Behavioral Baseline
       ↓
ML Model
       ↓
Real-Time Scoring
       ↓
Anomaly Detection
       ↓
Security Response
       ↓
Production Hardening
```

---

## 🎯 Potential Applications

Hallow could potentially provide an additional security layer for:

* 🔐 Sensitive web applications
* 🏦 Online banking interfaces
* 🏢 Enterprise applications
* ☁️ Cloud dashboards
* 👨‍💻 Developer environments
* 🛒 E-commerce accounts
* 🔑 High-value authenticated sessions

Behavioral biometrics are intended to function as an **additional security signal**, not as a replacement for strong authentication mechanisms such as passwords, passkeys, or multi-factor authentication.

---

## ⚠️ Security & Privacy Considerations

Behavioral biometrics introduce their own security and privacy challenges.

Hallow is being developed with consideration for:

* Data minimization
* Local processing
* Secure model storage
* Model poisoning resistance
* Replay and imitation attacks
* False-positive management
* False-negative management
* User consent and transparency

Because Hallow is still under development, **no production-level security guarantees should currently be assumed**.

---

## 🤝 Contributing

Hallow is an open development project.

Contributions, suggestions, issue reports, and security feedback are welcome.

If you discover a potential security vulnerability, please avoid publicly exposing sensitive details before the issue can be investigated.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👤 Author

**Mettu Shritan**

Computer Engineering student specializing in **Cybersecurity, IoT & Blockchain Technology** at **CBIT Hyderabad**.

Hallow is an exploration of **behavioral biometrics, browser security, and privacy-preserving machine learning**.

---

## ⭐ Project Vision

> **Make authentication continuous, intelligent, and privacy-preserving.**

Hallow aims to explore whether a user's unique interaction patterns can become another layer of defense against unauthorized access — while keeping behavioral data under the user's control.

---

### 🔒 Hallow

**Your behavior. Your device. Your security.**
