import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  Scale, 
  CreditCard, 
  UserCheck, 
  HelpCircle, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Phone, 
  MapPin, 
  ExternalLink,
  Clock,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Language, SiteContent } from '../types';

interface LegalPagesProps {
  siteContent?: SiteContent;
}

// -------------------------------------------------------------
// Multilingual Data for Terms of Service (Conditions d'Utilisation)
// -------------------------------------------------------------
const TERMS_CONTENT = {
  [Language.FRENCH]: {
    badge: "Document Légal",
    title: "Conditions Générales d'Utilisation",
    subtitle: "Règles régissant l'accès et l'utilisation de la plateforme éducative Lekòl Alèz.",
    lastUpdated: "Dernière mise à jour : 8 Septembre 2026",
    backHome: "Retour à l'accueil",
    tableOfContents: "Sommaire",
    sections: [
      {
        id: "preambule",
        title: "1. Présentation & Mission de la Plateforme",
        icon: Sparkles,
        content: `Bienvenue sur Lekòl Alèz (accessible via notre application web et mobile). Lekòl Alèz est une plateforme haïtienne de gestion de l'apprentissage (LMS) conçue pour démocratiser l'accès à un enseignement trilingue (Français, Kreyòl, Anglais) de haute qualité en Haïti et dans la diaspora.

En créant un compte ou en naviguant sur Lekòl Alèz, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas l'ensemble de ces dispositions, vous ne devez pas utiliser la plateforme.`
      },
      {
        id: "eligibilite-compte",
        title: "2. Inscription & Sécurité du Compte",
        icon: UserCheck,
        content: `Pour accéder à certaines fonctionnalités (suivi de cours, quiz, certificats, abonnements), vous devez créer un compte utilisateur.

• Exactitude des informations : Vous vous engagez à fournir des informations exactes, complètes et à jour (nom complet, adresse e-mail valide).
• Confidentialité des identifiants : Vous êtes le seul responsable de la sécurité de votre mot de passe. Tout acte accompli depuis votre compte est réputé être de votre fait.
• Unicité du compte : Un compte est strictement personnel et ne peut être partagé, loué ou cédé à un tiers.
• Âge requis : Les mineurs doivent obtenir le consentement préalable d'un parent ou tuteur légal pour s'inscrire.`
      },
      {
        id: "formules-quotas",
        title: "3. Formules d'Accès & Quotas Quotidiens",
        icon: BookOpen,
        content: `Lekòl Alèz propose deux modèles d'apprentissage :

1. Formule Gratuite (Free Access) :
Permet de visionner un quota quotidien défini (par défaut 1 vidéo par matière par jour : Français, Mathématiques, Sciences, etc.). Le quota est automatiquement réinitialisé chaque nuit à minuit (fuseau horaire d'Haïti / UTC-4). Les leçons déjà complétées restent consultables.

2. Abonnement Premium Alèz :
Donne un accès intégral et illimité à l'ensemble des vidéos, cours, leçons de tous les trimestres, ressources pédagogiques téléchargeables et délivrance de certificats officiels d'achèvement.`,
        callout: {
          type: 'info',
          text: "Sur le plan gratuit, le compteur quotidien de vidéos est strictement comptabilisé par matière et par jour calendaire pour garantir un accès équitable aux ressources de serveurs."
        }
      },
      {
        id: "paiements-abonnements",
        title: "4. Abonnements & Moyens de Paiement (MonCash, NatCash, Stripe)",
        icon: CreditCard,
        content: `Les abonnements Premium peuvent être souscrits selon plusieurs durées (mensuelle, trimestrielle, semestrielle ou annuelle).

• MonCash & NatCash : Les paiements effectués par portefeuille mobile en Haïti (MonCash ou NatCash) nécessitent la soumission du numéro de transaction officiel (Transaction ID). Les accès Premium sont activés après vérification par notre équipe administrative.
• Cartes bancaires (Stripe) : Les paiements internationaux par carte bancaire sont traités instantanément de manière sécurisée par Stripe.
• Prix et taxes : Tous les prix affichés sont nets en Gourdes haïtiennes (HTG) ou en Dollars US (USD) selon le mode de règlement sélectionné.
• Politique de remboursement : En raison de la mise à disposition immédiate des contenus numériques, les paiements d'abonnement ne sont pas remboursables une fois le service activé et consommé.`
      },
      {
        id: "propriete-intellectuelle",
        title: "5. Propriété Intellectuelle & Droits d'Auteur",
        icon: ShieldCheck,
        content: `L'intégralité des contenus disponibles sur Lekòl Alèz — incluant sans s'y limiter les vidéos pédagogiques, supports de lecture, exercices, quiz, visuels, logos, marques et codes sources — est la propriété exclusive de Lekòl Alèz et de ses enseignants partenaires.

• Licence limitée : Il vous est accordé un droit personnel, révocable, non exclusif et non transférable d'accéder aux cours pour vos stricts besoins personnels d'apprentissage.
• Interdictions formelles : Toute reproduction, téléchargement non autorisé, redistribution, revente, enregistrement d'écran ou diffusion publique de nos contenus est strictement prohibée et expose son auteur à des poursuites judiciaires.`
      },
      {
        id: "conduite-resiliation",
        title: "6. Règles de Conduite & Résiliation",
        icon: AlertCircle,
        content: `Tout utilisateur s'engage à respecter les autres membres de la communauté, les enseignants et l'équipe technique.

Sont rigoureusement interdits :
• Tout propos injurieux, haineux, diffamatoire ou déplacé dans les espaces communautaires ou de messagerie.
• Toute tentative de piratage, de surcharge des serveurs, de contournement des quotas ou d'extraction de données (scraping).

Lekòl Alèz se réserve le droit de suspendre temporairement ou de résilier définitivement tout compte en infraction avec ces règles, sans préavis ni indemnité.`
      },
      {
        id: "responsabilite-droit",
        title: "7. Responsabilité & Droit Applicable",
        icon: Scale,
        content: `Lekòl Alèz s'efforce d'assurer une disponibilité continue de ses services. Toutefois, nous ne pouvons garantir l'absence totale d'interruptions techniques liées aux fournisseurs d'infrastructure ou au réseau Internet.

Les présentes CGU sont soumises au droit haïtien. En cas de litige, les parties s'engagent à rechercher en priorité un règlement amiable avant toute action judiciaire devant les tribunaux compétents de Port-au-Prince, Haïti.`
      }
    ],
    needHelp: "Une question sur nos conditions d'utilisation ?",
    contactTeam: "Contactez notre équipe juridique et support"
  },

  [Language.ENGLISH]: {
    badge: "Legal Document",
    title: "Terms of Service",
    subtitle: "Rules and terms governing access to and use of the Lekòl Alèz learning platform.",
    lastUpdated: "Last updated: September 8, 2026",
    backHome: "Back to Home",
    tableOfContents: "Table of Contents",
    sections: [
      {
        id: "preambule",
        title: "1. Overview & Mission",
        icon: Sparkles,
        content: `Welcome to Lekòl Alèz (accessible via our web and mobile applications). Lekòl Alèz is a Haitian Learning Management System (LMS) designed to democratize access to high-quality trilingual education (French, Haitian Creole, English) in Haiti and throughout the diaspora.

By creating an account or browsing Lekòl Alèz, you acknowledge and unconditionally agree to these Terms of Service. If you do not accept these terms in full, you must refrain from using the platform.`
      },
      {
        id: "eligibilite-compte",
        title: "2. Account Registration & Security",
        icon: UserCheck,
        content: `To access key features (course tracking, quizzes, certificates, and premium subscriptions), you must create a user account.

• Accuracy of information: You agree to provide true, accurate, and current information (full name, valid email address).
• Credential confidentiality: You are solely responsible for maintaining the confidentiality of your login credentials and password.
• Non-transferability: Your account is strictly personal and may not be shared, rented, or transferred to any third party.
• Age requirements: Minors must obtain consent from a parent or legal guardian prior to registration.`
      },
      {
        id: "formules-quotas",
        title: "3. Access Plans & Daily Quotas",
        icon: BookOpen,
        content: `Lekòl Alèz offers two core learning models:

1. Free Access Plan:
Provides a daily free quota (by default 1 video per subject per day: French, Mathematics, Sciences, etc.). Quotas automatically reset each day at midnight local Haitian time (UTC-4). Already completed lessons remain accessible.

2. Premium Alèz Subscription:
Unlocks full, unrestricted access to all videos, lessons across all trimesters, downloadable course resources, and official verifiable completion certificates.`,
        callout: {
          type: 'info',
          text: "On the free plan, daily video counters are strictly tracked per subject and calendar day to guarantee fair system resource distribution."
        }
      },
      {
        id: "paiements-abonnements",
        title: "4. Subscriptions & Payment Methods (MonCash, NatCash, Stripe)",
        icon: CreditCard,
        content: `Premium plans can be purchased under various periods (1, 3, 6, or 12 months).

• MonCash & NatCash: Mobile wallet payments in Haiti (MonCash or NatCash) require submitting your official Transaction ID. Premium access is granted upon administrative verification.
• Credit Cards (Stripe): International credit/debit card transactions are processed securely and immediately via Stripe.
• Pricing and currencies: Displayed prices are shown in Haitian Gourdes (HTG) or US Dollars (USD) depending on chosen method.
• Refund policy: Due to the immediate delivery of digital learning content, subscriptions are non-refundable once activated and consumed.`
      },
      {
        id: "propriete-intellectuelle",
        title: "5. Intellectual Property & Copyright",
        icon: ShieldCheck,
        content: `All materials available on Lekòl Alèz — including but not limited to video tutorials, course outlines, readings, quizzes, graphics, logos, trademarks, and source code — are the exclusive property of Lekòl Alèz and its partner educators.

• Limited License: You receive a limited, revocable, non-exclusive, non-transferable license to access course materials for your own personal educational use.
• Prohibited actions: Any reproduction, unauthorized download, screen recording, commercial resale, or public broadcast of our content without prior written permission is strictly forbidden.`
      },
      {
        id: "conduite-resiliation",
        title: "6. Code of Conduct & Termination",
        icon: AlertCircle,
        content: `All students and users agree to treat instructors, fellow learners, and staff with dignity and respect.

The following activities will result in immediate sanctions:
• Harassment, hate speech, or inappropriate messages in discussion boards or direct chat.
• Hacking attempts, server overloading, quota evasion tricks, or data scraping.

Lekòl Alèz reserves the right to suspend or terminate any offending account without prior notice or compensation.`
      },
      {
        id: "responsabilite-droit",
        title: "7. Limitation of Liability & Applicable Law",
        icon: Scale,
        content: `Lekòl Alèz strives for constant platform availability. However, we cannot guarantee uninterrupted service against infrastructure or regional telecommunications outages.

These Terms are governed by the laws of the Republic of Haiti. Any disputes that cannot be settled amicably shall be brought before the competent courts of Port-au-Prince, Haiti.`
      }
    ],
    needHelp: "Have a question regarding our Terms of Service?",
    contactTeam: "Contact our legal & support team"
  },

  [Language.CREOLE]: {
    badge: "Dokiman Legal",
    title: "Kondisyon Itilizasyon",
    subtitle: "Règ ak kondisyon ki gouvène aksè ak itilizasyon platfòm edikasyon Lekòl Alèz.",
    lastUpdated: "Dènye modifikasyon : 8 Septanm 2026",
    backHome: "Retounen sou Akèy",
    tableOfContents: "Somè",
    sections: [
      {
        id: "preambule",
        title: "1. Prezantasyon ak Misyon Platfòm nan",
        icon: Sparkles,
        content: `Byenveni sou Lekòl Alèz (ki disponib sou sit entènèt ak aplikasyon mobil nou an). Lekòl Alèz se yon platfòm LMS ayisyen ki fèt pou fè tout moun jwenn yon bon edikasyon nan 3 lang (Franse, Kreyòl, Anglè) an Ayiti kou nan dyaspora a.

Lè w kreye yon kont oswa ou navige sou Lekòl Alèz, ou aksepte tout Kondisyon Itilizasyon sa yo san rezèv. Si w pa dakò ak tout règ sa yo, ou pa dwe sèvi ak platfòm nan.`
      },
      {
        id: "eligibilite-compte",
        title: "2. Enskripsyon ak Sekirite Kont Ou",
        icon: UserCheck,
        content: `Pou w ka suiv leson, fè kwis, pran sètifika oswa peye abònman, ou dwe kreye yon kont pèsonèl.

• Enfòmasyon egzak : Ou pran angajman pou bay bon enfòmasyon ki kòrèk (non konplè w, yon bon adrès imèl ki fonksyone).
• Sekirite modpas la : Se ou menm sèl ki responsab sekirite modpas ou. Nenpòt aksyon ki fèt sou kont ou konsidere kòm se ou ki fè li.
• Kont pèsonèl : Yon kont se pou yon sèl moun. Li entèdi pou pataje, prete oswa vann li bay lòt moun.
• Moun ki poko majè : Elèv ki poko gen 18 an dwe gen otorizasyon paran yo pou yo enskri.`
      },
      {
        id: "formules-quotas",
        title: "3. Plan Aksè ak Kota Chak Jou",
        icon: BookOpen,
        content: `Lekòl Alèz ofri 2 fòmil aprantisaj :

1. Plan Gratis (Free Access) :
Ou gen dwa gade yon kota videyo gratis chak jou (1 videyo pa matyè pa jou : Franse, Matematik, Syans, elatriye). Kota sa a renouvle otomatikman chak jou a minwi (lè Ayiti / UTC-4). Leson ou te deja fini yo rete disponib pou w revize.

2. Abònman Premium Alèz :
Ba w aksè san limit a TOUT videyo yo, tout leson nan tout trimès, materyèl pou telechaje, ak sètifika ofisyèl lè w fini yon kou.`,
        callout: {
          type: 'info',
          text: "Sou plan gratis la, kalkil kota a fèt pa matyè ak pa jou pou pèmèt tout elèv jwenn menm chans pou aprann sou sèvè yo."
        }
      },
      {
        id: "paiements-abonnements",
        title: "4. Abònman ak Mwayen Peman (MonCash, NatCash, Stripe)",
        icon: CreditCard,
        content: `Ou ka pran abònman Premium pou 1 mwa, 3 mwa, 6 mwa oswa 1 lane.

• MonCash & NatCash : Peman ki fèt an Ayiti pa MonCash oswa NatCash mande pou w antre ID Tranzaksyon ofisyèl la. Aksè Premium lan ap aktive touswit apre administratè nou yo fin verifye tranzaksyon an.
• Kat Labank (Stripe) : Peman entènasyonal pa kat fèt otomatikman epi an sekirite grasa sistèm Stripe la.
• Pri ak lajan : Pri yo afiche an Goud (HTG) oswa an Dola Ameriken (USD) selon mwayen peman ou chwazi a.
• Règleman ranbousman : Piske se kontni nimerik ki disponib touswit, pa gen ranbousman apre abònman an fin aktive epi itilize.`
      },
      {
        id: "propriete-intellectuelle",
        title: "5. Dwa Otè ak Pwopriyete Entèlektyèl",
        icon: ShieldCheck,
        content: `Tout sa ki sou Lekòl Alèz — tankou videyo leson yo, dokiman lekti, egzèsis, kwis, imaj, logo, ak kòd sistèm nan — se pwopriyete eksklizif Lekòl Alèz ak pwofesè patnè nou yo.

• Pèmisyon pèsonèl : Nou ba w dwa pou w gade epi aprann ak kontni sa yo pou tèt pa w sèlman.
• Entèdiksyon strik : Li entèdi pou telechaje san otorizasyon, anrejistre ekran, kopye, vann oswa distribye videyo ak materyèl Lekòl Alèz bay lòt moun san pèmisyon ekri.`
      },
      {
        id: "conduite-resiliation",
        title: "6. Bon Konpòtman ak Fèmti Kont",
        icon: AlertCircle,
        content: `Chak manm dwe gen respè pou lòt elèv yo, pwofesè yo ak anplwaye Lekòl Alèz yo.

Aksyon sa yo entèdi nèt :
• Jouman, pawòl rayisab oswa mank dega nan espas kominote ak mesaj yo.
• Tantativ pirataj, bloke sèvè yo, oswa chèche pase kota gratis la nan vòlò.

Lekòl Alèz gen tout dwa pou fèmen kont nenpòt moun ki vyole règleman sa yo san avètisman.`
      },
      {
        id: "responsabilite-droit",
        title: "7. Responsablite ak Lwa ki Aplike",
        icon: Scale,
        content: `Lekòl Alèz fè tout efò l pou sistèm nan toujou mache 24 sou 24. Men nou pa kapab responsab pann kouran jeneral oswa pwoblèm entènèt nan rezo peyi a.

Kondisyon sa yo respekte lwa Repiblik d Ayiti. Si gen nenpòt dezakò, n ap chèche yon solisyon amikal dabò anvan nou ale devan tribinal nan Pòtoprens, Ayiti.`
      }
    ],
    needHelp: "Ou gen yon kesyon sou kondisyon itilizasyon nou yo ?",
    contactTeam: "Kontakte ekip legal ak sipò nou an"
  }
};

// -----------------------------------------------------------------
// Multilingual Data for Privacy Policy (Politique de Confidentialité)
// -----------------------------------------------------------------
const PRIVACY_CONTENT = {
  [Language.FRENCH]: {
    badge: "Confidentialité & Vie Privée",
    title: "Politique de Confidentialité",
    subtitle: "Comment Lekòl Alèz protège, gère et respecte vos données personnelles.",
    lastUpdated: "Dernière mise à jour : 8 Septembre 2026",
    backHome: "Retour à l'accueil",
    tableOfContents: "Sommaire",
    sections: [
      {
        id: "engagement",
        title: "1. Notre Engagement pour votre Vie Privée",
        icon: ShieldCheck,
        content: `Chez Lekòl Alèz, la protection de vos données personnelles et le respect de votre vie privée sont fondamentaux. Cette politique détaille la manière dont nous collectons, utilisons, stockons et protégeons vos données lorsque vous utilisez notre plateforme éducative.

En utilisant Lekòl Alèz, vous consentez aux pratiques décrites dans la présente politique.`
      },
      {
        id: "donnees-collectees",
        title: "2. Les Données que nous Collectons",
        icon: UserCheck,
        content: `Nous ne collectons que les informations strictement nécessaires à la prestation de nos services :

• Données d'identité : Nom complet, prénom, adresse e-mail, photo de profil (facultative) et mot de passe chiffré.
• Données d'apprentissage : Cours rejoints, progression par leçon, vidéos consultées, scores aux quiz, devoirs complétés et certificats délivrés.
• Données de transaction financière : ID de transaction MonCash ou NatCash, montant payé, statut de vérification, reçus de paiement via Stripe. IMPORTANT : Lekòl Alèz ne stocke jamais vos numéros de cartes de crédit complets ; ces données sont directement traitées de manière chiffrée par Stripe (norme PCI-DSS).
• Données techniques & de sécurité : Adresse IP, type d'appareil, navigateur, journaux d'activité et d'audit pour prévenir les fraudes et sécuriser les accès.`
      },
      {
        id: "utilisation-donnees",
        title: "3. Utilisation de vos Données",
        icon: BookOpen,
        content: `Vos données personnelles sont traitées pour les finalités suivantes :

1. Fourniture et personnalisation du service : Vous permettre d'accéder à vos cours, suivre votre progression pédagogique et mémoriser l'état de vos leçons.
2. Gestion des quotas & abonnements : Vérifier l'éligibilité au quota quotidien gratuit et activer les accès illimités Premium Alèz.
3. Sécurité et traçabilité : Protéger votre compte contre les tentatives d'accès non autorisées et assurer la conformité grâce aux journaux d'audit.
4. Support et communications : Vous envoyer des notifications de progression, des réinitialisations de mot de passe sécurisées ou répondre à vos demandes de support.`
      },
      {
        id: "non-partage",
        title: "4. Non-Vente & Partage Restreint des Données",
        icon: Lock,
        content: `Nous appliquons une règle absolue : Lekòl Alèz ne vend, ne loue et ne commercialise JAMAIS vos données personnelles à des tiers à des fins publicitaires.

Vos données ne sont partagées qu'avec nos prestataires techniques de confiance, dans la stricte limite de leur mission :
• Prestataires de paiement : Stripe, Digicel MonCash, Natcom NatCash (uniquement pour valider vos règlements).
• Hébergement et bases de données sécurisées : Supabase (PostgreSQL sous chiffrement au repos et en transit).
• Autorités légales : Uniquement si la loi haïtienne ou une ordonnance judiciaire valide l'exige impérativement.`
      },
      {
        id: "securite-stockage",
        title: "5. Sécurité & Chiffrement des Données",
        icon: ShieldCheck,
        content: `Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles de pointe :

• Chiffrement de bout en bout : Toutes les communications entre votre appareil et nos serveurs sont protégées par le protocole HTTPS / TLS.
• Hachage fort des mots de passe : Vos mots de passe sont chiffrés de manière irréversible avant tout stockage.
• Politiques de sécurité au niveau des lignes (RLS) : La base de données Supabase applique un cloisonnement strict garantissant que chaque étudiant ne peut accéder qu'à ses propres données privées.`,
        callout: {
          type: 'success',
          text: "Vos sessions et préférences de langue sont stockées localement sur votre navigateur (localStorage) sans traceurs publicitaires intrusifs."
        }
      },
      {
        id: "vos-droits",
        title: "6. Vos Droits d'Accès, Rectification & Suppression",
        icon: Scale,
        content: `Conformément aux bonnes pratiques internationales de protection des données :

• Droit d'accès et de rectification : Vous pouvez modifier vos informations personnelles à tout moment depuis la section Paramètres de votre profil.
• Droit à l'oubli (suppression) : Vous pouvez demander la suppression complète et définitive de votre compte et de toutes vos données associées en contactant notre équipe support.
• Portabilité : Vous pouvez solliciter un relevé de vos notes de quiz et certificats obtenus.`
      },
      {
        id: "cookies-stockage-local",
        title: "7. Cookies & Préférences Locales",
        icon: HelpCircle,
        content: `Lekòl Alèz utilise des technologies de stockage local simples (localStorage) pour des raisons purement fonctionnelles :
• Maintenir votre session connectée.
• Conserver votre choix de langue (Français, Kreyòl, Anglais).
• Mémoriser l'avancement de lecture de vos vidéos.

Nous n'utilisons aucun cookie espion ni régie publicitaire tierce.`
      }
    ],
    needHelp: "Une question sur vos données personnelles ?",
    contactTeam: "Contactez notre délégué à la protection des données"
  },

  [Language.ENGLISH]: {
    badge: "Privacy & Data Protection",
    title: "Privacy Policy",
    subtitle: "How Lekòl Alèz protects, handles, and respects your personal information.",
    lastUpdated: "Last updated: September 8, 2026",
    backHome: "Back to Home",
    tableOfContents: "Table of Contents",
    sections: [
      {
        id: "engagement",
        title: "1. Our Privacy Commitment",
        icon: ShieldCheck,
        content: `At Lekòl Alèz, protecting your personal data and safeguarding your privacy are core priorities. This Privacy Policy details how we collect, use, store, and protect your information when using our learning platform.

By using Lekòl Alèz, you consent to the data practices described herein.`
      },
      {
        id: "donnees-collectees",
        title: "2. Information We Collect",
        icon: UserCheck,
        content: `We collect only the minimum data required to deliver high-quality educational experiences:

• Identity data: Full name, email address, optional profile picture, and securely hashed passwords.
• Learning activity: Enrolled courses, completed lessons, watched video duration, quiz results, and verified certificates.
• Financial transaction records: MonCash/NatCash transaction IDs, amount paid, verification state, and Stripe payment receipts. IMPORTANT: Lekòl Alèz never stores full credit card numbers; card transactions are handled under PCI-DSS compliance directly by Stripe.
• Technical & security data: IP addresses, device/browser details, and audit log entries used to detect security anomalies and protect user accounts.`
      },
      {
        id: "utilisation-donnees",
        title: "3. How We Use Your Data",
        icon: BookOpen,
        content: `Your data is processed strictly for legitimate educational and service purposes:

1. Delivery of services: Granting access to courses, saving lesson progress, and calculating completion milestones.
2. Quota & subscription enforcement: Tracking the free daily lesson quota per subject and activating Premium Alèz subscriptions.
3. Security & account integrity: Guarding against unauthorized logins through automated audit logging.
4. Notifications & support: Delivering course update notifications, secure password reset links, and answering support inquiries.`
      },
      {
        id: "non-partage",
        title: "4. No-Sale Guarantee & Third-Party Sharing",
        icon: Lock,
        content: `We maintain a strict principle: Lekòl Alèz NEVER sells, rents, or monetizes your personal data to any advertisers or third-party brokers.

Data is shared exclusively with essential infrastructure providers:
• Payment processors: Stripe, Digicel MonCash, Natcom NatCash (solely to confirm transaction authenticity).
• Cloud database infrastructure: Supabase (PostgreSQL with encryption at rest and in transit).
• Legal authorities: Only when strictly required by enforceable legal process under the laws of the Republic of Haiti.`
      },
      {
        id: "securite-stockage",
        title: "5. Security & Encryption Standards",
        icon: ShieldCheck,
        content: `We employ enterprise-grade technical and organizational safeguards:

• End-to-end encryption: All communication between your device and our servers is secured via HTTPS / TLS.
• Strong password hashing: Passwords are permanently salted and hashed before persistence.
• Row Level Security (RLS): Supabase database policies isolate user records, ensuring students can only access their authorized data.`,
        callout: {
          type: 'success',
          text: "Language preferences and session tokens are stored in your browser's localStorage without intrusive third-party ad tracking."
        }
      },
      {
        id: "vos-droits",
        title: "6. Your Rights (Access, Correction & Deletion)",
        icon: Scale,
        content: `In accordance with modern data protection principles:

• Right to review & edit: You can update your profile information anytime in Account Settings.
• Right to erasure: You may request complete account and data deletion by contacting our support team.
• Data portability: You may request an export of your quiz scores and completed certificates.`
      },
      {
        id: "cookies-stockage-local",
        title: "7. Cookies & Local Storage",
        icon: HelpCircle,
        content: `Lekòl Alèz uses standard browser localStorage for essential functional purposes only:
• Keeping you securely logged in.
• Remembering your chosen language (French, Haitian Creole, English).
• Resuming video playback from where you left off.

We do not use advertising or tracking cookies.`
      }
    ],
    needHelp: "Questions about your personal data?",
    contactTeam: "Contact our Data Protection Team"
  },

  [Language.CREOLE]: {
    badge: "Konfidansyalite ak Done Pèsonèl",
    title: "Règleman sou Konfidansyalite",
    subtitle: "Fason Lekòl Alèz pwoteje, jere ak respekte tout enfòmasyon pèsonèl ou.",
    lastUpdated: "Dènye modifikasyon : 8 Septanm 2026",
    backHome: "Retounen sou Akèy",
    tableOfContents: "Somè",
    sections: [
      {
        id: "engagement",
        title: "1. Angajman Nou Pou Pwoteje Ou",
        icon: ShieldCheck,
        content: `Pou Lekòl Alèz, pwoteje vi prive w ak done pèsonèl ou se yon priyorite fondamantal. Règleman sa a eksplike aklè kijan nou ranmase, itilize epi pwoteje enfòmasyon w lè w ap sèvi ak platfòm edikasyon nou an.

Lè w sèvi ak Lekòl Alèz, ou dakò ak tout prensip ki ekri nan dokiman sa a.`
      },
      {
        id: "donnees-collectees",
        title: "2. Enfòmasyon Nou Ranmase",
        icon: UserCheck,
        content: `Nou sèlman pran enfòmasyon ki nesesè pou rann sèvis aprantisaj la posib :

• Enfòmasyon sou idantite w : Non konplè w, adrès imèl, foto pwofil (si w vle mete l), ak modpas ki chifre an sekirite.
• Done aprantisaj ou : Kou ou enskri ladan yo, leson ou deja fini, kantite videyo ou gade, nòt kwis ou fè ak sètifika ou resevwa.
• Prèv peman : Nimewo tranzaksyon MonCash oswa NatCash, montan w peye, ak resi Stripe. ENPÒTAN : Lekòl Alèz pa janm estoke nimewo kat labank ou ; tout peman pa kat fèt dirèkteman an sekirite sou sistèm Stripe.
• Done teknik ak sekirite : Adrès IP, kalite aparèy ak navigatè ou itilize, ak jounal koneksyon pou verifye si pa gen tantativ fwod sou kont ou.`
      },
      {
        id: "utilisation-donnees",
        title: "3. Kijan Nou Itilize Done Ou Yo",
        icon: BookOpen,
        content: `Nou itilize done ou yo sèlman pou rezon sa yo :

1. Pou bay sèvis edikasyon an : Pou w ka suiv leson w yo, wè pwogresyon w epi sonje kote w te rete nan videyo yo.
2. Pou jere kota ak abònman : Pou verifye si w pa depase 1 videyo pa matyè pa jou sou plan gratis la, oswa pou debloke aksè san limit si w gen Premium.
3. Pou garanti sekirite kont ou : Pou anpeche moun antre nan kont ou san pèmisyon.
4. Pou voye enfòmasyon enpòtan ba ou : Tankou lyen pou chanje modpas si w bliye l oswa reponn kesyon ou poze ekip sipò a.`
      },
      {
        id: "non-partage",
        title: "4. Nou Pa Janm Vann Done Ou Yo",
        icon: Lock,
        content: `Nou gen yon prensip fèm : Lekòl Alèz PA JANM vann, lwe oswa pataje done pèsonèl ou bay moun k ap fè piblisite.

Nou sèlman pataje sa ki nesesè ak patnè teknik nou yo pou sistèm nan ka mache :
• Konpayi peman : Stripe, MonCash, NatCash (pou konfime ou fin peye vre).
• Baz done an sekirite : Supabase (ki sere done yo avèk chifreman solid).
• Lapolis oswa lajistis : Sèlman si gen yon manda legal dapre lwa peyi d Ayiti.`
      },
      {
        id: "securite-stockage",
        title: "5. Sekirite ak Pwoteksyon Done Yo",
        icon: ShieldCheck,
        content: `Nou pran gwo mezi teknik pou enfòmasyon w pa janm an danje :

• Chifreman HTTPS / TLS : Tout sa k ap sikile ant telefòn/òdinatè w ak sèvè nou yo pwoteje.
• Modpas ki chifre : Pèsonn pa ka li modpas ou, li kode anvan menm li anrejistre nan baz done a.
• Sekirite RLS : Baz done nou an asire ke se ou menm sèl ki ka wè pwogrè ak done pèsonèl kont ou.`,
        callout: {
          type: 'success',
          text: "Nou itilize localStorage navigatè w la pou kenbe lang ou chwazi a (Kreyòl, Franse, Anglè) san okenn espyonaj piblisitè."
        }
      },
      {
        id: "vos-droits",
        title: "6. Dwa Ou Genyen Sou Done Ou Yo",
        icon: Scale,
        content: `Dapre prensip entènasyonal sou vi prive :

• Dwa pou wè ak chanje : Ou ka modifye non w oswa enfòmasyon w nenpòt lè nan paj Paramèt kont ou an.
• Dwa pou efase : Ou ka mande pou efase kont ou ak tout done ou nèt sou platfòm nan si w ekri sipò a.
• Dwa pou telechaje : Ou ka mande yon kopi nòt ak sètifika ou te ranpòte yo.`
      },
      {
        id: "cookies-stockage-local",
        title: "7. Kuki ak Memwa Lokal Navigatè a",
        icon: HelpCircle,
        content: `Lekòl Alèz sèvi ak memwa lokal aparèy ou an (localStorage) pou rezon trè senp :
• Pou w pa oblije rekonekte chak fwa w ouvri paj la.
• Pou sonje si w te chwazi Kreyòl, Franse oswa Anglè.
• Pou rekòmanse videyo a egzakteman kote w te kanpe a.

Nou pa sèvi ak kuki piblisite ki swiv ou sou entènèt.`
      }
    ],
    needHelp: "Ou gen yon kesyon sou done pèsonèl ou ?",
    contactTeam: "Kontakte responsab pwoteksyon done nou an"
  }
};

// -------------------------------------------------------------
// Shared Layout Component for Legal Documents
// -------------------------------------------------------------
interface LegalTemplateProps {
  data: typeof TERMS_CONTENT[Language.FRENCH];
  siteContent?: SiteContent;
  heroColor: string;
}

const LegalTemplate: React.FC<LegalTemplateProps> = ({ data, siteContent, heroColor }) => {
  const [activeSection, setActiveSection] = useState<string>(data.sections[0]?.id || '');

  // Scroll to section handler
  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90; // header offset
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      for (const section of data.sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [data.sections]);

  const contactEmail = siteContent?.contact?.email || 'hello@lekolalez.com';
  const contactPhone = siteContent?.contact?.phone || '+509 1234 5678';
  const contactAddress = siteContent?.contact?.address || 'Port-au-Prince, Haïti';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Hero Banner */}
      <div className={`relative overflow-hidden ${heroColor} text-white pt-24 pb-16 px-6`}>
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white mb-6 transition-colors bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-sm"
          >
            <ArrowLeft size={16} />
            {data.backHome}
          </Link>

          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white mb-4">
            {data.badge}
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">
            {data.title}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed mb-6 font-normal">
            {data.subtitle}
          </p>

          <div className="flex items-center gap-2 text-xs md:text-sm text-white/75">
            <Clock size={16} />
            <span>{data.lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sticky Table of Contents (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <FileText size={16} className="text-brand-blue" />
                {data.tableOfContents}
              </h3>
              <nav className="space-y-1">
                {data.sections.map((section) => {
                  const isActive = activeSection === section.id;
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand-blue/10 text-brand-blue font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-brand-blue shrink-0' : 'text-slate-400 shrink-0'} />
                      <span className="truncate">{section.title}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Quick Contact Card */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-3">{data.needHelp}</p>
                <a
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-2 text-xs font-bold text-brand-blue hover:underline"
                >
                  <Mail size={14} />
                  {contactEmail}
                </a>
              </div>
            </div>
          </aside>

          {/* Legal Sections Body */}
          <main className="lg:col-span-8 space-y-10">
            {data.sections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <motion.section
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8 scroll-mt-28"
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
                        {section.title}
                      </h2>
                    </div>
                  </div>

                  <div className="text-slate-600 leading-relaxed space-y-3 whitespace-pre-line text-sm md:text-base font-normal">
                    {section.content}
                  </div>

                  {section.callout && (
                    <div
                      className={`mt-5 p-4 rounded-xl text-sm flex items-start gap-3 border ${
                        section.callout.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-blue-50 border-blue-200 text-blue-900'
                      }`}
                    >
                      {section.callout.type === 'success' ? (
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle size={18} className="text-brand-blue shrink-0 mt-0.5" />
                      )}
                      <p className="font-medium leading-relaxed">{section.callout.text}</p>
                    </div>
                  )}
                </motion.section>
              );
            })}

            {/* Bottom Support Callout */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-md">
              <h3 className="text-xl font-bold mb-2 text-white flex items-center gap-2">
                <ShieldCheck className="text-brand-blue" size={24} />
                {data.needHelp}
              </h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                {data.contactTeam} :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs md:text-sm">
                <div className="flex items-center gap-2 text-slate-300 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <Mail size={16} className="text-brand-blue shrink-0" />
                  <span className="truncate">{contactEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <Phone size={16} className="text-brand-blue shrink-0" />
                  <span>{contactPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                  <MapPin size={16} className="text-brand-blue shrink-0" />
                  <span className="truncate">{contactAddress}</span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// Exported Component: Terms of Service Page
// -------------------------------------------------------------
export const TermsPage: React.FC<LegalPagesProps> = ({ siteContent }) => {
  const { language } = useLanguage();
  const data = TERMS_CONTENT[language] || TERMS_CONTENT[Language.FRENCH];

  return (
    <LegalTemplate 
      data={data} 
      siteContent={siteContent} 
      heroColor="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950" 
    />
  );
};

// -------------------------------------------------------------
// Exported Component: Privacy Policy Page
// -------------------------------------------------------------
export const PrivacyPage: React.FC<LegalPagesProps> = ({ siteContent }) => {
  const { language } = useLanguage();
  const data = PRIVACY_CONTENT[language] || PRIVACY_CONTENT[Language.FRENCH];

  return (
    <LegalTemplate 
      data={data} 
      siteContent={siteContent} 
      heroColor="bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950" 
    />
  );
};
