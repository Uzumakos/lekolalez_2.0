import React, { useState, useEffect } from 'react';
import {
  SiteContent,
  PricingPlan,
  StaffMember,
  FreeAccessSettings,
  PaymentGatewaySettings,
  CustomContentBlock,
  HeroSlideContent,
  WhyUsFeatureBlock,
  LegalSectionBlock,
  LegalDocumentContent,
} from '../types';
import {
  Save,
  Plus,
  Trash2,
  Edit3,
  Check,
  Layout,
  DollarSign,
  Users,
  Mail,
  FileText,
  Sparkles,
  UserPlus,
  Camera,
  Gift,
  CreditCard,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Home,
  BookOpen,
  Scale,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';
import { generateCourseDescription } from '../services/geminiService';
import { siteContentAPI } from '../services/api';

interface AdminContentManagerProps {
  content: SiteContent;
  onUpdate?: (newContent: SiteContent) => void;
  onUpdateContent?: (newContent: SiteContent) => void;
}

const DEFAULT_FREE_ACCESS: FreeAccessSettings = {
  isEnabled: true,
  durationDays: null,
  videosPerSubjectPerDay: 1,
};

const DEFAULT_GATEWAYS: PaymentGatewaySettings = {
  stripe: {
    isEnabled: true,
    publishableKey: '',
    currency: 'USD',
    allowRecurring: true,
    allowPrepaid: true,
  },
  moncash: {
    isEnabled: true,
    merchantNumber: '+509 3600-0000',
    receiverName: 'Lekòl Alèz EdTech',
    instructions:
      'Envoyez le montant exact en HTG via MonCash à ce numéro, puis entrez votre numéro de transaction (Réf) ci-dessous.',
  },
  natcash: {
    isEnabled: true,
    merchantNumber: '+509 4000-0000',
    receiverName: 'Lekòl Alèz EdTech',
    instructions:
      'Envoyez le montant exact en HTG via NatCash à ce numéro, puis entrez votre code de référence ci-dessous.',
  },
  exchangeRateHTG: 132,
};

const DEFAULT_LANDING: NonNullable<SiteContent['landing']> = {
  slides: [
    {
      id: 'slide-1',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80',
      title: 'Apprenez sans limites avec Lekòl Alèz',
      subtitle: 'Des cours interactifs conçus pour la réussite des élèves haïtiens, accessibles partout et à tout moment.',
      ctaText: 'Commencer maintenant',
      demoText: 'Voir la démo',
    },
    {
      id: 'slide-2',
      image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1920&q=80',
      title: 'Des professeurs experts à votre écoute',
      subtitle: 'Maîtrisez le programme officiel grâce à des vidéos claires, des quiz pratiques et un tuteur IA personnel.',
      ctaText: 'Explorer les cours',
      demoText: 'Voir la démo',
    },
    {
      id: 'slide-3',
      image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1920&q=80',
      title: 'Préparez votre avenir dès aujourd’hui',
      subtitle: 'Rejoignez des milliers d’étudiants et développez vos compétences à votre propre rythme.',
      ctaText: 'Rejoindre gratuitement',
      demoText: 'Voir la démo',
    },
  ],
  coursesBadge: 'Apprendre à votre rythme',
  coursesTitle: 'Cours en Vedette',
  coursesViewAllText: 'Voir tous les cours',
  whyBadge: 'Pourquoi choisir Lekòl Alèz',
  whyTitle: 'Une éducation moderne pensée pour votre réussite',
  whyDesc: 'Nous combinons l’excellence pédagogique avec la technologie pour offrir une expérience d’apprentissage unique, accessible sur téléphone, tablette ou ordinateur.',
  whyImageUrl: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  whyCtaText: 'En savoir plus sur nous',
  whyFeatures: [
    {
      id: 'feat-1',
      title: 'Tuteur IA Intelligent 24/7',
      desc: 'Posez vos questions en Français, Créole ou Anglais et obtenez des explications instantanées.',
    },
    {
      id: 'feat-2',
      title: 'Apprentissage à votre rythme',
      desc: 'Révisez les vidéos et refaites les quiz autant de fois que nécessaire pour maîtriser chaque matière.',
    },
    {
      id: 'feat-3',
      title: 'Contenu aligné et certifié',
      desc: 'Des cours structurés par trimestre par les meilleurs enseignants pour garantir votre succès.',
    },
  ],
  ctaTitle: 'Prêt à transformer votre façon d’apprendre ?',
  ctaSubtitle: 'Inscrivez-vous dès aujourd’hui et accédez immédiatement à nos cours et outils interactifs.',
  ctaPrimaryBtn: 'Créer un compte gratuit',
  ctaSecondaryBtn: 'Contacter le support',
  customBlocks: [],
};

const DEFAULT_CATALOG: NonNullable<SiteContent['catalog']> = {
  title: 'Catalogue des Cours',
  subtitle: 'Explorez l’ensemble de nos matières et programmes classés par niveau.',
  emptyTitle: 'Aucun cours disponible pour le moment',
  emptyDesc: 'De nouveaux cours seront publiés très prochainement.',
};

const DEFAULT_FOOTER: NonNullable<SiteContent['footer']> = {
  description: 'La plateforme éducative de référence dédiée à l’excellence académique et accessible à tous les étudiants.',
  platformTitle: 'Plateforme',
  companyTitle: 'Entreprise',
  contactTitle: 'Contact',
  copyrightText: 'Lekòl Alèz. Tous droits réservés.',
};

const DEFAULT_TERMS: LegalDocumentContent = {
  badge: 'Document Officiel',
  title: "Conditions Générales d'Utilisation",
  subtitle: "Veuillez lire attentivement ces conditions avant d'utiliser la plateforme éducative Lekòl Alèz.",
  lastUpdated: 'Dernière mise à jour : Octobre 2026',
  needHelp: 'Une question juridique ?',
  contactTeam: 'Contacter notre équipe',
  sections: [
    {
      id: 'terms-1',
      title: '1. Acceptation des Conditions',
      content:
        "En accédant à la plateforme Lekòl Alèz et en créant un compte, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation.",
      calloutType: 'info',
      calloutText: "L'utilisation continue de la plateforme vaut acceptation de toute mise à jour ultérieure.",
    },
    {
      id: 'terms-2',
      title: '2. Accès aux Cours & Abonnements',
      content:
        "Lekòl Alèz propose un accès gratuit limité ainsi que des abonnements Premium donnant un accès complet aux vidéos, quiz et ressources pédagogiques.",
      calloutType: 'none',
    },
    {
      id: 'terms-3',
      title: '3. Propriété Intellectuelle',
      content:
        "L'ensemble des vidéos, textes, quiz, logos et supports pédagogiques présents sur Lekòl Alèz sont protégés par le droit d'auteur. Toute reproduction ou redistribution non autorisée est strictement interdite.",
      calloutType: 'none',
    },
  ],
};

const DEFAULT_PRIVACY: LegalDocumentContent = {
  badge: 'Protection des Données',
  title: 'Politique de Confidentialité',
  subtitle: 'Découvrez comment nous protégeons vos informations personnelles et respectons votre vie privée sur Lekòl Alèz.',
  lastUpdated: 'Dernière mise à jour : Octobre 2026',
  needHelp: 'Des questions sur vos données ?',
  contactTeam: 'Contacter le DPO',
  sections: [
    {
      id: 'priv-1',
      title: '1. Collecte des Informations',
      content:
        'Nous collectons uniquement les informations nécessaires à la création de votre compte étudiant, au suivi de votre progression académique et à la gestion de votre abonnement.',
      calloutType: 'success',
      calloutText: 'Vos données personnelles ne sont jamais vendues ni cédées à des tiers.',
    },
    {
      id: 'priv-2',
      title: '2. Utilisation des Données',
      content:
        'Vos données servent à personnaliser votre tableau de bord, sauvegarder vos résultats de quiz et vous offrir une assistance pédagogique adaptée.',
      calloutType: 'none',
    },
    {
      id: 'priv-3',
      title: '3. Sécurité & Confidentialité',
      content:
        'Toutes les communications et transactions sont chiffrées de bout en bout. Vous pouvez demander la modification ou la suppression de votre compte à tout moment.',
      calloutType: 'none',
    },
  ],
};

type ContentTab =
  | 'landing'
  | 'about'
  | 'pricing'
  | 'catalog_footer'
  | 'instructors'
  | 'contact'
  | 'legal'
  | 'free_access'
  | 'payment_gateways';

export const AdminContentManager: React.FC<AdminContentManagerProps> = ({ content, onUpdate, onUpdateContent }) => {
  const [activeTab, setActiveTab] = useState<ContentTab>('about');
  const [legalSubTab, setLegalSubTab] = useState<'terms' | 'privacy'>('terms');
  const [tempContent, setTempContent] = useState<SiteContent>({
    ...content,
    about: {
      ...content.about,
      stats: content.about?.stats || [],
      staff: content.about?.staff || [],
      customBlocks: content.about?.customBlocks || [],
    },
    pricing: {
      ...content.pricing,
      plans: content.pricing?.plans || [],
    },
    landing: {
      ...DEFAULT_LANDING,
      ...(content.landing || {}),
      slides: content.landing?.slides?.length ? content.landing.slides : DEFAULT_LANDING.slides,
      whyFeatures: content.landing?.whyFeatures?.length ? content.landing.whyFeatures : DEFAULT_LANDING.whyFeatures,
      customBlocks: content.landing?.customBlocks || [],
    },
    catalog: {
      ...DEFAULT_CATALOG,
      ...(content.catalog || {}),
    },
    footer: {
      ...DEFAULT_FOOTER,
      ...(content.footer || {}),
    },
    legal: {
      terms: {
        ...DEFAULT_TERMS,
        ...(content.legal?.terms || {}),
        sections: content.legal?.terms?.sections?.length
          ? content.legal.terms.sections
          : DEFAULT_TERMS.sections,
      },
      privacy: {
        ...DEFAULT_PRIVACY,
        ...(content.legal?.privacy || {}),
        sections: content.legal?.privacy?.sections?.length
          ? content.legal.privacy.sections
          : DEFAULT_PRIVACY.sections,
      },
    },
    freeAccess: content.freeAccess || DEFAULT_FREE_ACCESS,
    paymentGateways: content.paymentGateways || DEFAULT_GATEWAYS,
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setTempContent({
      ...content,
      about: {
        ...content.about,
        stats: content.about?.stats || [],
        staff: content.about?.staff || [],
        customBlocks: content.about?.customBlocks || [],
      },
      pricing: {
        ...content.pricing,
        plans: content.pricing?.plans || [],
      },
      landing: {
        ...DEFAULT_LANDING,
        ...(content.landing || {}),
        slides: content.landing?.slides?.length ? content.landing.slides : DEFAULT_LANDING.slides,
        whyFeatures: content.landing?.whyFeatures?.length ? content.landing.whyFeatures : DEFAULT_LANDING.whyFeatures,
        customBlocks: content.landing?.customBlocks || [],
      },
      catalog: {
        ...DEFAULT_CATALOG,
        ...(content.catalog || {}),
      },
      footer: {
        ...DEFAULT_FOOTER,
        ...(content.footer || {}),
      },
      legal: {
        terms: {
          ...DEFAULT_TERMS,
          ...(content.legal?.terms || {}),
          sections: content.legal?.terms?.sections?.length
            ? content.legal.terms.sections
            : DEFAULT_TERMS.sections,
        },
        privacy: {
          ...DEFAULT_PRIVACY,
          ...(content.legal?.privacy || {}),
          sections: content.legal?.privacy?.sections?.length
            ? content.legal.privacy.sections
            : DEFAULT_PRIVACY.sections,
        },
      },
      freeAccess: content.freeAccess || DEFAULT_FREE_ACCESS,
      paymentGateways: content.paymentGateways || DEFAULT_GATEWAYS,
    });
  }, [content]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await siteContentAPI.update({
        about: tempContent.about,
        pricing: tempContent.pricing,
        instructors: tempContent.instructors,
        contact: tempContent.contact,
        landing: tempContent.landing,
        catalog: tempContent.catalog,
        footer: tempContent.footer,
        legal: tempContent.legal,
        freeAccess: tempContent.freeAccess,
        paymentGateways: tempContent.paymentGateways,
      });
      if (onUpdate) onUpdate(tempContent);
      if (onUpdateContent) onUpdateContent(tempContent);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      setSaveError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiPolish = async (field: 'about' | 'subtitle') => {
    setIsGenerating(true);
    const prompt = field === 'about' ? 'About Us page content for Lekol Alèz' : 'Catchy subtitle for Lekol Alèz';
    const result = await generateCourseDescription(prompt, 'General Education Platform');
    if (result) {
      if (field === 'about') {
        setTempContent(prev => ({ ...prev, about: { ...prev.about, content: result } }));
      } else {
        setTempContent(prev => ({ ...prev, about: { ...prev.about, subtitle: result } }));
      }
    }
    setIsGenerating(false);
  };

  // --- About Key Stats Management (Add / Remove / Reorder / Edit) ---
  const handleAddStat = () => {
    setTempContent(prev => ({
      ...prev,
      about: {
        ...prev.about,
        stats: [...(prev.about.stats || []), { value: '100+', label: 'Nouvelle Statistique' }],
      },
    }));
  };

  const handleRemoveStat = (index: number) => {
    setTempContent(prev => ({
      ...prev,
      about: {
        ...prev.about,
        stats: (prev.about.stats || []).filter((_, idx) => idx !== index),
      },
    }));
  };

  const handleMoveStat = (index: number, direction: 'up' | 'down') => {
    const currentStats = [...(tempContent.about.stats || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentStats.length) return;
    const [moved] = currentStats.splice(index, 1);
    currentStats.splice(targetIndex, 0, moved);
    setTempContent(prev => ({
      ...prev,
      about: { ...prev.about, stats: currentStats },
    }));
  };

  const handleUpdateStat = (index: number, field: 'value' | 'label', val: string) => {
    const newStats = [...(tempContent.about.stats || [])];
    newStats[index] = { ...newStats[index], [field]: val };
    setTempContent(prev => ({
      ...prev,
      about: { ...prev.about, stats: newStats },
    }));
  };

  // --- About Custom Blocks Management ---
  const handleAddAboutBlock = () => {
    const newBlock: CustomContentBlock = {
      id: `block-${Date.now()}`,
      title: 'Nouvelle Section',
      content: 'Rédigez le contenu de cette section ici...',
      imageUrl: '',
    };
    setTempContent(prev => ({
      ...prev,
      about: {
        ...prev.about,
        customBlocks: [...(prev.about.customBlocks || []), newBlock],
      },
    }));
  };

  const handleUpdateAboutBlock = (id: string, field: keyof CustomContentBlock, value: string) => {
    setTempContent(prev => ({
      ...prev,
      about: {
        ...prev.about,
        customBlocks: (prev.about.customBlocks || []).map(b =>
          b.id === id ? { ...b, [field]: value } : b
        ),
      },
    }));
  };

  const handleRemoveAboutBlock = (id: string) => {
    setTempContent(prev => ({
      ...prev,
      about: {
        ...prev.about,
        customBlocks: (prev.about.customBlocks || []).filter(b => b.id !== id),
      },
    }));
  };

  // --- Staff Management ---
  const handleAddStaff = () => {
    const newMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: 'Nouveau Membre',
      role: 'Rôle / Poste',
      photoUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      bio: 'Courte biographie...',
    };
    setTempContent(prev => ({
      ...prev,
      about: {
        ...prev.about,
        staff: [...(prev.about.staff || []), newMember],
      },
    }));
  };

  const handleUpdateStaff = (id: string, field: keyof StaffMember, value: string) => {
    setTempContent(prev => ({
      ...prev,
      about: {
        ...prev.about,
        staff: (prev.about.staff || []).map(member =>
          member.id === id ? { ...member, [field]: value } : member
        ),
      },
    }));
  };

  const handleRemoveStaff = (id: string) => {
    setTempContent(prev => ({
      ...prev,
      about: {
        ...prev.about,
        staff: (prev.about.staff || []).filter(member => member.id !== id),
      },
    }));
  };

  // --- Landing Page Slides & Why-Us Features Management ---
  const handleAddSlide = () => {
    const newSlide: HeroSlideContent = {
      id: `slide-${Date.now()}`,
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80',
      title: 'Nouveau Titre de Diapositive',
      subtitle: 'Sous-titre descriptif pour la bannière principale...',
      ctaText: 'Commencer maintenant',
      demoText: 'Voir la démo',
    };
    setTempContent(prev => ({
      ...prev,
      landing: {
        ...(prev.landing || DEFAULT_LANDING),
        slides: [...(prev.landing?.slides || []), newSlide],
      },
    }));
  };

  const handleUpdateSlide = (id: string, field: keyof HeroSlideContent, value: string) => {
    setTempContent(prev => ({
      ...prev,
      landing: {
        ...(prev.landing || DEFAULT_LANDING),
        slides: (prev.landing?.slides || []).map(s => (s.id === id ? { ...s, [field]: value } : s)),
      },
    }));
  };

  const handleRemoveSlide = (id: string) => {
    setTempContent(prev => ({
      ...prev,
      landing: {
        ...(prev.landing || DEFAULT_LANDING),
        slides: (prev.landing?.slides || []).filter(s => s.id !== id),
      },
    }));
  };

  const handleAddWhyFeature = () => {
    const newFeature: WhyUsFeatureBlock = {
      id: `feat-${Date.now()}`,
      title: 'Nouvel Avantage Clé',
      desc: 'Description de cet avantage pour les étudiants...',
    };
    setTempContent(prev => ({
      ...prev,
      landing: {
        ...(prev.landing || DEFAULT_LANDING),
        whyFeatures: [...(prev.landing?.whyFeatures || []), newFeature],
      },
    }));
  };

  const handleUpdateWhyFeature = (id: string, field: keyof WhyUsFeatureBlock, value: string) => {
    setTempContent(prev => ({
      ...prev,
      landing: {
        ...(prev.landing || DEFAULT_LANDING),
        whyFeatures: (prev.landing?.whyFeatures || []).map(f =>
          f.id === id ? { ...f, [field]: value } : f
        ),
      },
    }));
  };

  const handleRemoveWhyFeature = (id: string) => {
    setTempContent(prev => ({
      ...prev,
      landing: {
        ...(prev.landing || DEFAULT_LANDING),
        whyFeatures: (prev.landing?.whyFeatures || []).filter(f => f.id !== id),
      },
    }));
  };

  const handleAddLandingBlock = () => {
    const newBlock: CustomContentBlock = {
      id: `lblock-${Date.now()}`,
      title: 'Nouveau Bloc Page d’Accueil',
      content: 'Texte personnalisé affiché sur la page d’accueil...',
      imageUrl: '',
    };
    setTempContent(prev => ({
      ...prev,
      landing: {
        ...(prev.landing || DEFAULT_LANDING),
        customBlocks: [...(prev.landing?.customBlocks || []), newBlock],
      },
    }));
  };

  const handleUpdateLandingBlock = (id: string, field: keyof CustomContentBlock, value: string) => {
    setTempContent(prev => ({
      ...prev,
      landing: {
        ...(prev.landing || DEFAULT_LANDING),
        customBlocks: (prev.landing?.customBlocks || []).map(b =>
          b.id === id ? { ...b, [field]: value } : b
        ),
      },
    }));
  };

  const handleRemoveLandingBlock = (id: string) => {
    setTempContent(prev => ({
      ...prev,
      landing: {
        ...(prev.landing || DEFAULT_LANDING),
        customBlocks: (prev.landing?.customBlocks || []).filter(b => b.id !== id),
      },
    }));
  };

  // --- Pricing Management ---
  const handleUpdatePlan = (index: number, field: keyof PricingPlan, value: any) => {
    const newPlans = [...tempContent.pricing.plans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    setTempContent(prev => ({ ...prev, pricing: { ...prev.pricing, plans: newPlans } }));
  };

  const handleAddFeature = (planIndex: number) => {
    const newPlans = [...tempContent.pricing.plans];
    newPlans[planIndex].features.push('Nouvel avantage');
    setTempContent(prev => ({ ...prev, pricing: { ...prev.pricing, plans: newPlans } }));
  };

  const handleRemoveFeature = (planIndex: number, featureIndex: number) => {
    const newPlans = [...tempContent.pricing.plans];
    newPlans[planIndex].features.splice(featureIndex, 1);
    setTempContent(prev => ({ ...prev, pricing: { ...prev.pricing, plans: newPlans } }));
  };

  const handleFeatureChange = (planIndex: number, featureIndex: number, value: string) => {
    const newPlans = [...tempContent.pricing.plans];
    newPlans[planIndex].features[featureIndex] = value;
    setTempContent(prev => ({ ...prev, pricing: { ...prev.pricing, plans: newPlans } }));
  };

  // --- Legal Sections Management ---
  const handleAddLegalSection = (docType: 'terms' | 'privacy') => {
    const currentDoc = tempContent.legal?.[docType] || (docType === 'terms' ? DEFAULT_TERMS : DEFAULT_PRIVACY);
    const nextNum = (currentDoc.sections?.length || 0) + 1;
    const newSection: LegalSectionBlock = {
      id: `${docType}-sec-${Date.now()}`,
      title: `${nextNum}. Nouvelle Section`,
      content: 'Rédigez le texte juridique de cette clause...',
      calloutType: 'none',
      calloutText: '',
    };
    setTempContent(prev => ({
      ...prev,
      legal: {
        terms: prev.legal?.terms || DEFAULT_TERMS,
        privacy: prev.legal?.privacy || DEFAULT_PRIVACY,
        [docType]: {
          ...currentDoc,
          sections: [...(currentDoc.sections || []), newSection],
        },
      },
    }));
  };

  const handleUpdateLegalSection = (
    docType: 'terms' | 'privacy',
    sectionId: string,
    field: keyof LegalSectionBlock,
    value: any
  ) => {
    const currentDoc = tempContent.legal?.[docType] || (docType === 'terms' ? DEFAULT_TERMS : DEFAULT_PRIVACY);
    setTempContent(prev => ({
      ...prev,
      legal: {
        terms: prev.legal?.terms || DEFAULT_TERMS,
        privacy: prev.legal?.privacy || DEFAULT_PRIVACY,
        [docType]: {
          ...currentDoc,
          sections: (currentDoc.sections || []).map(sec =>
            sec.id === sectionId ? { ...sec, [field]: value } : sec
          ),
        },
      },
    }));
  };

  const handleRemoveLegalSection = (docType: 'terms' | 'privacy', sectionId: string) => {
    const currentDoc = tempContent.legal?.[docType] || (docType === 'terms' ? DEFAULT_TERMS : DEFAULT_PRIVACY);
    setTempContent(prev => ({
      ...prev,
      legal: {
        terms: prev.legal?.terms || DEFAULT_TERMS,
        privacy: prev.legal?.privacy || DEFAULT_PRIVACY,
        [docType]: {
          ...currentDoc,
          sections: (currentDoc.sections || []).filter(sec => sec.id !== sectionId),
        },
      },
    }));
  };

  const tabs: { id: ContentTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'about', label: 'À Propos & Stats', icon: <FileText size={16} /> },
    { id: 'landing', label: "Page d'Accueil", icon: <Home size={16} /> },
    { id: 'pricing', label: 'Tarifs', icon: <DollarSign size={16} /> },
    { id: 'catalog_footer', label: 'Catalogue & Pied de page', icon: <BookOpen size={16} /> },
    { id: 'instructors', label: 'Instructeurs', icon: <Users size={16} /> },
    { id: 'contact', label: 'Contact', icon: <Mail size={16} /> },
    { id: 'legal', label: 'Pages Légales (CGU)', icon: <Scale size={16} /> },
    {
      id: 'free_access',
      label: 'Accès Gratuit',
      icon: <Gift size={16} />,
      badge: tempContent.freeAccess.isEnabled ? 'Actif' : 'Inactif',
    },
    {
      id: 'payment_gateways',
      label: 'Paiements (MonCash / Stripe)',
      icon: <CreditCard size={16} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestionnaire de Contenu (CMS Complet)</h2>
          <p className="text-sm text-slate-500">
            Modifiez librement tous les textes, statistiques, blocs des pages publiques, règles d'accès et paiements.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${isSaved ? 'bg-green-600' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/25'
            } disabled:opacity-60`}
        >
          {isSaved ? <Check size={18} /> : <Save size={18} />}
          {isSaving ? 'Sauvegarde...' : isSaved ? 'Sauvegardé !' : 'Enregistrer les modifications'}
        </button>
      </div>

      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {saveError}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 overflow-x-auto gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3.5 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
              ? 'border-primary-600 text-primary-600 bg-primary-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tempContent.freeAccess.isEnabled
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
                  }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-2xl rounded-tr-2xl border border-slate-100 shadow-sm p-6 lg:p-8">
        {/* ============================================================
            TAB: ABOUT PAGE, STATS & STAFF
        ============================================================ */}
        {activeTab === 'about' && (
          <div className="space-y-8 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Titre Principal</label>
                <input
                  type="text"
                  value={tempContent.about.title}
                  onChange={e =>
                    setTempContent({
                      ...tempContent,
                      about: { ...tempContent.about, title: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Image de Bannière (URL optionnelle)
                </label>
                <input
                  type="text"
                  value={tempContent.about.imageUrl || ''}
                  onChange={e =>
                    setTempContent({
                      ...tempContent,
                      about: { ...tempContent.about, imageUrl: e.target.value },
                    })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-700">Sous-titre</label>
                <button
                  onClick={() => handleAiPolish('subtitle')}
                  disabled={isGenerating}
                  className="text-xs text-primary-600 font-bold flex items-center gap-1 hover:underline"
                >
                  <Sparkles size={12} /> Améliorer avec l'IA
                </button>
              </div>
              <input
                type="text"
                value={tempContent.about.subtitle}
                onChange={e =>
                  setTempContent({
                    ...tempContent,
                    about: { ...tempContent.about, subtitle: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-700">Notre Histoire (Contenu)</label>
                <button
                  onClick={() => handleAiPolish('about')}
                  disabled={isGenerating}
                  className="text-xs text-primary-600 font-bold flex items-center gap-1 hover:underline"
                >
                  <Sparkles size={12} /> Générer avec l'IA
                </button>
              </div>
              <textarea
                rows={6}
                value={tempContent.about.content}
                onChange={e =>
                  setTempContent({
                    ...tempContent,
                    about: { ...tempContent.about, content: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Statistiques Clés - Dynamic Add / Remove / Reorder / Edit */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Statistiques Clés</h3>
                  <p className="text-xs text-slate-500">
                    Ajoutez, modifiez ou supprimez des blocs de statistiques (affichés sur la page À Propos et l'Accueil).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddStat}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-xl text-sm font-bold hover:bg-primary-100 transition-colors"
                >
                  <Plus size={16} /> Ajouter un bloc
                </button>
              </div>

              {(tempContent.about.stats || []).length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
                  Aucune statistique affichée. Cliquez sur « Ajouter un bloc » pour en créer une.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(tempContent.about.stats || []).map((stat, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group hover:border-primary-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Bloc #{idx + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveStat(idx, 'up')}
                            disabled={idx === 0}
                            title="Monter"
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStat(idx, 'down')}
                            disabled={idx === (tempContent.about.stats || []).length - 1}
                            title="Descendre"
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStat(idx)}
                            title="Supprimer ce bloc"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={stat.value}
                        onChange={e => handleUpdateStat(idx, 'value', e.target.value)}
                        className="w-full font-bold text-lg bg-white border border-slate-200 rounded-lg px-3 py-1.5 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Valeur (ex: 2k+)"
                      />
                      <input
                        type="text"
                        value={stat.label}
                        onChange={e => handleUpdateStat(idx, 'label', e.target.value)}
                        className="w-full text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Libellé (ex: Étudiants)"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blocs de Contenu Personnalisés (About Page) */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Layers size={18} className="text-primary-600" />
                    Blocs de Contenu Supplémentaires (Page À Propos)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ajoutez des sections personnalisées (Mission, Vision, Valeurs, etc.) sur la page À Propos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddAboutBlock}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                >
                  <Plus size={16} /> Ajouter une section
                </button>
              </div>

              {(tempContent.about.customBlocks || []).length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  Aucune section supplémentaire. Cliquez sur « Ajouter une section » pour enrichir la page À Propos.
                </div>
              ) : (
                <div className="space-y-4">
                  {(tempContent.about.customBlocks || []).map(block => (
                    <div
                      key={block.id}
                      className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative"
                    >
                      <div className="flex justify-between items-center gap-2">
                        <input
                          type="text"
                          value={block.title}
                          onChange={e => handleUpdateAboutBlock(block.id, 'title', e.target.value)}
                          placeholder="Titre de la section (ex: Notre Mission)"
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAboutBlock(block.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer cette section"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={block.content}
                        onChange={e => handleUpdateAboutBlock(block.id, 'content', e.target.value)}
                        placeholder="Contenu texte de la section..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700"
                      />
                      <input
                        type="text"
                        value={block.imageUrl || ''}
                        onChange={e => handleUpdateAboutBlock(block.id, 'imageUrl', e.target.value)}
                        placeholder="URL d'image optionnelle (https://...)"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-600"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Staff Directory Management */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Notre Équipe (Meet the Staff)</h3>
                  <p className="text-sm text-slate-500">
                    Personnalisez le titre de la section et gérez les membres de l'équipe.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddStaff}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                >
                  <UserPlus size={16} /> Ajouter un membre
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Badge Équipe</label>
                  <input
                    type="text"
                    value={tempContent.about.staffBadge || ''}
                    onChange={e =>
                      setTempContent({
                        ...tempContent,
                        about: { ...tempContent.about, staffBadge: e.target.value },
                      })
                    }
                    placeholder="Ex: Notre Équipe"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Titre Section Équipe</label>
                  <input
                    type="text"
                    value={tempContent.about.staffTitle || ''}
                    onChange={e =>
                      setTempContent({
                        ...tempContent,
                        about: { ...tempContent.about, staffTitle: e.target.value },
                      })
                    }
                    placeholder="Ex: Rencontrez notre équipe"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Sous-titre Équipe</label>
                  <input
                    type="text"
                    value={tempContent.about.staffSubtitle || ''}
                    onChange={e =>
                      setTempContent({
                        ...tempContent,
                        about: { ...tempContent.about, staffSubtitle: e.target.value },
                      })
                    }
                    placeholder="Ex: Des professionnels passionnés..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(tempContent.about.staff || []).map(member => (
                  <div
                    key={member.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-4 relative group"
                  >
                    <button
                      type="button"
                      onClick={() => handleRemoveStaff(member.id)}
                      className="absolute top-3 right-3 p-1.5 bg-white text-slate-400 hover:text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Supprimer ce membre"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-200 shrink-0 border-2 border-white shadow-sm">
                        <img
                          src={member.photoUrl}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={member.name}
                          onChange={e => handleUpdateStaff(member.id, 'name', e.target.value)}
                          placeholder="Nom complet"
                          className="w-full font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary-500"
                        />
                        <input
                          type="text"
                          value={member.role}
                          onChange={e => handleUpdateStaff(member.id, 'role', e.target.value)}
                          placeholder="Rôle (ex: Directeur Pédagogique)"
                          className="w-full font-medium text-primary-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                        <Camera size={12} /> URL de la Photo
                      </label>
                      <input
                        type="text"
                        value={member.photoUrl}
                        onChange={e => handleUpdateStaff(member.id, 'photoUrl', e.target.value)}
                        placeholder="https://..."
                        className="w-full text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">
                        Biographie courte (Optionnel)
                      </label>
                      <textarea
                        rows={2}
                        value={member.bio || ''}
                        onChange={e => handleUpdateStaff(member.id, 'bio', e.target.value)}
                        placeholder="Quelques mots sur ce membre..."
                        className="w-full text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-500 resize-none"
                      />
                    </div>
                  </div>
                ))}

                {(!tempContent.about.staff || tempContent.about.staff.length === 0) && (
                  <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Aucun membre d'équipe ajouté. Cliquez sur "Ajouter un membre" pour commencer.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB: LANDING PAGE (HOME)
        ============================================================ */}
        {activeTab === 'landing' && (
          <div className="space-y-10 max-w-4xl">
            {/* 1. Hero Slides */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">1. Diaporama Principal (Hero Slider)</h3>
                  <p className="text-xs text-slate-500">
                    Ajoutez, modifiez ou supprimez les diapositives en haut de la page d'accueil.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSlide}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-xl text-sm font-bold hover:bg-primary-100"
                >
                  <Plus size={16} /> Ajouter une diapositive
                </button>
              </div>

              <div className="space-y-4">
                {(tempContent.landing?.slides || []).map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
                        Diapositive #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlide(slide.id)}
                        disabled={(tempContent.landing?.slides || []).length <= 1}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"
                        title="Supprimer cette diapositive"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Titre</label>
                        <input
                          type="text"
                          value={slide.title}
                          onChange={e => handleUpdateSlide(slide.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          URL de l'image de fond
                        </label>
                        <input
                          type="text"
                          value={slide.image}
                          onChange={e => handleUpdateSlide(slide.id, 'image', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Sous-titre</label>
                      <textarea
                        rows={2}
                        value={slide.subtitle}
                        onChange={e => handleUpdateSlide(slide.id, 'subtitle', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Texte Bouton Principal
                        </label>
                        <input
                          type="text"
                          value={slide.ctaText || ''}
                          onChange={e => handleUpdateSlide(slide.id, 'ctaText', e.target.value)}
                          placeholder="Ex: Commencer maintenant"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Texte Bouton Démo
                        </label>
                        <input
                          type="text"
                          value={slide.demoText || ''}
                          onChange={e => handleUpdateSlide(slide.id, 'demoText', e.target.value)}
                          placeholder="Ex: Voir la démo"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Featured Courses Section Header */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                2. En-tête de la Section « Cours en Vedette »
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Petit Badge (Eyebrow)</label>
                  <input
                    type="text"
                    value={tempContent.landing?.coursesBadge || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        landing: { ...(prev.landing || DEFAULT_LANDING), coursesBadge: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Titre de la Section</label>
                  <input
                    type="text"
                    value={tempContent.landing?.coursesTitle || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        landing: { ...(prev.landing || DEFAULT_LANDING), coursesTitle: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Texte du bouton « Voir tout »
                  </label>
                  <input
                    type="text"
                    value={tempContent.landing?.coursesViewAllText || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        landing: {
                          ...(prev.landing || DEFAULT_LANDING),
                          coursesViewAllText: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 3. Why Choose Us Section + Dynamic Feature Blocks */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    3. Section « Pourquoi Choisir Lekòl Alèz »
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modifiez le texte principal et ajoutez/supprimez les blocs d'avantages.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddWhyFeature}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-xl text-sm font-bold hover:bg-primary-100"
                >
                  <Plus size={16} /> Ajouter un avantage
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Badge</label>
                  <input
                    type="text"
                    value={tempContent.landing?.whyBadge || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        landing: { ...(prev.landing || DEFAULT_LANDING), whyBadge: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Titre</label>
                  <input
                    type="text"
                    value={tempContent.landing?.whyTitle || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        landing: { ...(prev.landing || DEFAULT_LANDING), whyTitle: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={tempContent.landing?.whyDesc || ''}
                  onChange={e =>
                    setTempContent(prev => ({
                      ...prev,
                      landing: { ...(prev.landing || DEFAULT_LANDING), whyDesc: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">URL de l'image</label>
                  <input
                    type="text"
                    value={tempContent.landing?.whyImageUrl || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        landing: { ...(prev.landing || DEFAULT_LANDING), whyImageUrl: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Texte du Bouton</label>
                  <input
                    type="text"
                    value={tempContent.landing?.whyCtaText || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        landing: { ...(prev.landing || DEFAULT_LANDING), whyCtaText: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Dynamic Feature Blocks */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Blocs d'avantages ({(tempContent.landing?.whyFeatures || []).length})
                </label>
                {(tempContent.landing?.whyFeatures || []).map((feat, idx) => (
                  <div
                    key={feat.id}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center shrink-0 mt-1">
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={feat.title}
                        onChange={e => handleUpdateWhyFeature(feat.id, 'title', e.target.value)}
                        placeholder="Titre de l'avantage"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold"
                      />
                      <textarea
                        rows={2}
                        value={feat.desc}
                        onChange={e => handleUpdateWhyFeature(feat.id, 'desc', e.target.value)}
                        placeholder="Description..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveWhyFeature(feat.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Supprimer cet avantage"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Bottom CTA Banner */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">
                4. Bannière d'Appel à l'Action (Bas de page d'accueil)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Titre</label>
                  <input
                    type="text"
                    value={tempContent.landing?.ctaTitle || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        landing: { ...(prev.landing || DEFAULT_LANDING), ctaTitle: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Sous-titre</label>
                  <input
                    type="text"
                    value={tempContent.landing?.ctaSubtitle || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        landing: { ...(prev.landing || DEFAULT_LANDING), ctaSubtitle: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Texte Bouton Principal
                  </label>
                  <input
                    type="text"
                    value={tempContent.landing?.ctaPrimaryBtn || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        landing: { ...(prev.landing || DEFAULT_LANDING), ctaPrimaryBtn: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Texte Bouton Secondaire
                  </label>
                  <input
                    type="text"
                    value={tempContent.landing?.ctaSecondaryBtn || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        landing: {
                          ...(prev.landing || DEFAULT_LANDING),
                          ctaSecondaryBtn: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 5. Custom Blocks on Landing Page */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    5. Blocs Personnalisés (Page d'Accueil)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ajoutez librement des sections de texte/image supplémentaires sur la page d'accueil.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddLandingBlock}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800"
                >
                  <Plus size={16} /> Ajouter un bloc
                </button>
              </div>

              {(tempContent.landing?.customBlocks || []).map(block => (
                <div
                  key={block.id}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 mb-3"
                >
                  <div className="flex justify-between items-center gap-2">
                    <input
                      type="text"
                      value={block.title}
                      onChange={e => handleUpdateLandingBlock(block.id, 'title', e.target.value)}
                      placeholder="Titre du bloc"
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLandingBlock(block.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={block.content}
                    onChange={e => handleUpdateLandingBlock(block.id, 'content', e.target.value)}
                    placeholder="Contenu du bloc..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                  <input
                    type="text"
                    value={block.imageUrl || ''}
                    onChange={e => handleUpdateLandingBlock(block.id, 'imageUrl', e.target.value)}
                    placeholder="URL d'image optionnelle (https://...)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB: PRICING PLANS
        ============================================================ */}
        {activeTab === 'pricing' && (
          <div className="space-y-8">
            {/* Page Header Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Titre de la Page Tarifs
                </label>
                <input
                  type="text"
                  value={tempContent.pricing.title}
                  onChange={e =>
                    setTempContent({
                      ...tempContent,
                      pricing: { ...tempContent.pricing, title: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Sous-titre de la Page Tarifs
                </label>
                <input
                  type="text"
                  value={tempContent.pricing.subtitle}
                  onChange={e =>
                    setTempContent({
                      ...tempContent,
                      pricing: { ...tempContent.pricing, subtitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Texte du Badge « Populaire »
                </label>
                <input
                  type="text"
                  value={tempContent.pricing.popularBadge || ''}
                  onChange={e =>
                    setTempContent({
                      ...tempContent,
                      pricing: { ...tempContent.pricing, popularBadge: e.target.value },
                    })
                  }
                  placeholder="Ex: Le plus populaire"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tempContent.pricing.plans.map((plan, idx) => (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-6 flex flex-col justify-between relative ${plan.isPopular
                    ? 'border-primary-500 shadow-xl shadow-primary-500/10 bg-white'
                    : 'border-slate-200 bg-slate-50/50'
                    }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <input
                        type="text"
                        value={plan.name}
                        onChange={e => handleUpdatePlan(idx, 'name', e.target.value)}
                        className="font-bold text-lg text-slate-900 bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none w-2/3"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs flex items-center gap-1 cursor-pointer select-none text-slate-500">
                          <input
                            type="checkbox"
                            checked={plan.isPopular || false}
                            onChange={e => handleUpdatePlan(idx, 'isPopular', e.target.checked)}
                            className="rounded text-primary-600 focus:ring-primary-500"
                          />
                          Populaire
                        </label>
                        {tempContent.pricing.plans.length > 1 && (
                          <button
                            onClick={() => {
                              const newPlans = tempContent.pricing.plans.filter((_, i) => i !== idx);
                              setTempContent(prev => ({
                                ...prev,
                                pricing: { ...prev.pricing, plans: newPlans },
                              }));
                            }}
                            className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                            title="Supprimer ce plan"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-bold text-slate-400">$</span>
                      <input
                        type="text"
                        value={plan.price}
                        onChange={e => handleUpdatePlan(idx, 'price', e.target.value)}
                        className="text-4xl font-extrabold text-slate-900 bg-transparent w-24 border-b border-transparent focus:border-slate-300 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={plan.period}
                        onChange={e => handleUpdatePlan(idx, 'period', e.target.value)}
                        className="text-sm text-slate-500 bg-transparent w-24 border-b border-transparent focus:border-slate-300 focus:outline-none"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Texte du bouton d'action
                      </label>
                      <input
                        type="text"
                        value={plan.buttonText}
                        onChange={e => handleUpdatePlan(idx, 'buttonText', e.target.value)}
                        placeholder="Ex: Choisir ce plan"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                      />
                    </div>

                    <div className="space-y-3 mb-6">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                        Fonctionnalités incluses
                      </label>
                      {plan.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2">
                          <Check size={14} className="text-green-500 shrink-0" />
                          <input
                            type="text"
                            value={feature}
                            onChange={e => handleFeatureChange(idx, fIdx, e.target.value)}
                            className="text-sm text-slate-600 bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none flex-1"
                          />
                          <button
                            onClick={() => handleRemoveFeature(idx, fIdx)}
                            className="text-slate-300 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => handleAddFeature(idx)}
                        className="text-xs text-primary-600 font-bold flex items-center gap-1 mt-2 hover:underline"
                      >
                        <Plus size={14} /> Ajouter une ligne
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200/60">
                    <div className="text-xs text-center text-slate-400 mb-2">Aperçu du bouton</div>
                    <button
                      type="button"
                      className={`w-full py-2 rounded-lg font-bold text-sm pointer-events-none opacity-80 ${plan.isPopular ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                    >
                      {plan.buttonText}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const newPlan: PricingPlan = {
                  id: `plan-${Date.now()}`,
                  name: 'Nouveau Plan',
                  price: '19',
                  period: '/ mois',
                  features: ['Accès complet aux cours', 'Quiz illimités', 'Support prioritaire'],
                  isPopular: false,
                  buttonText: 'Choisir ce plan',
                };
                setTempContent(prev => ({
                  ...prev,
                  pricing: { ...prev.pricing, plans: [...prev.pricing.plans, newPlan] },
                }));
              }}
              className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-primary-500 rounded-2xl text-slate-500 hover:text-primary-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={18} /> Ajouter un nouveau plan tarifaire
            </button>
          </div>
        )}

        {/* ============================================================
            TAB: CATALOG & FOOTER
        ============================================================ */}
        {activeTab === 'catalog_footer' && (
          <div className="space-y-10 max-w-3xl">
            {/* Catalog Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">1. Page Catalogue des Cours</h3>
              <p className="text-xs text-slate-500">
                Personnalisez les titres et messages affichés sur la page publique des cours.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Titre de la Page</label>
                  <input
                    type="text"
                    value={tempContent.catalog?.title || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        catalog: { ...(prev.catalog || DEFAULT_CATALOG), title: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Sous-titre</label>
                  <input
                    type="text"
                    value={tempContent.catalog?.subtitle || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        catalog: { ...(prev.catalog || DEFAULT_CATALOG), subtitle: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Message si aucun cours (Titre)
                  </label>
                  <input
                    type="text"
                    value={tempContent.catalog?.emptyTitle || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        catalog: { ...(prev.catalog || DEFAULT_CATALOG), emptyTitle: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Message si aucun cours (Description)
                  </label>
                  <input
                    type="text"
                    value={tempContent.catalog?.emptyDesc || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        catalog: { ...(prev.catalog || DEFAULT_CATALOG), emptyDesc: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <h3 className="text-lg font-bold text-slate-900">2. Pied de Page (Footer Global)</h3>
              <p className="text-xs text-slate-500">
                Modifiez les textes apparaissant tout en bas de toutes les pages du site.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Description sous le logo Lekòl Alèz
                </label>
                <textarea
                  rows={3}
                  value={tempContent.footer?.description || ''}
                  onChange={e =>
                    setTempContent(prev => ({
                      ...prev,
                      footer: { ...(prev.footer || DEFAULT_FOOTER), description: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Titre Colonne 1 (Plateforme)
                  </label>
                  <input
                    type="text"
                    value={tempContent.footer?.platformTitle || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        footer: { ...(prev.footer || DEFAULT_FOOTER), platformTitle: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Titre Colonne 2 (Entreprise)
                  </label>
                  <input
                    type="text"
                    value={tempContent.footer?.companyTitle || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        footer: { ...(prev.footer || DEFAULT_FOOTER), companyTitle: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Titre Colonne 3 (Contact)
                  </label>
                  <input
                    type="text"
                    value={tempContent.footer?.contactTitle || ''}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        footer: { ...(prev.footer || DEFAULT_FOOTER), contactTitle: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Mention Copyright (Bas de page)
                </label>
                <input
                  type="text"
                  value={tempContent.footer?.copyrightText || ''}
                  onChange={e =>
                    setTempContent(prev => ({
                      ...prev,
                      footer: { ...(prev.footer || DEFAULT_FOOTER), copyrightText: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB: INSTRUCTORS
        ============================================================ */}
        {activeTab === 'instructors' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Titre de la Page Instructeurs
              </label>
              <input
                type="text"
                value={tempContent.instructors.title}
                onChange={e =>
                  setTempContent({
                    ...tempContent,
                    instructors: { ...tempContent.instructors, title: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Sous-titre</label>
              <input
                type="text"
                value={tempContent.instructors.subtitle}
                onChange={e =>
                  setTempContent({
                    ...tempContent,
                    instructors: { ...tempContent.instructors, subtitle: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Titre / Rôle par défaut sous chaque instructeur
              </label>
              <input
                type="text"
                value={tempContent.instructors.defaultRole || ''}
                onChange={e =>
                  setTempContent({
                    ...tempContent,
                    instructors: { ...tempContent.instructors, defaultRole: e.target.value },
                  })
                }
                placeholder="Ex: Instructeur Senior & Créateur de Cours"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        {/* ============================================================
            TAB: CONTACT
        ============================================================ */}
        {activeTab === 'contact' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email de Support</label>
              <input
                type="email"
                value={tempContent.contact.email}
                onChange={e =>
                  setTempContent({
                    ...tempContent,
                    contact: { ...tempContent.contact, email: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Numéro de Téléphone</label>
              <input
                type="text"
                value={tempContent.contact.phone}
                onChange={e =>
                  setTempContent({
                    ...tempContent,
                    contact: { ...tempContent.contact, phone: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Adresse Physique</label>
              <input
                type="text"
                value={tempContent.contact.address}
                onChange={e =>
                  setTempContent({
                    ...tempContent,
                    contact: { ...tempContent.contact, address: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        {/* ============================================================
            TAB: LEGAL PAGES (TERMS & PRIVACY)
        ============================================================ */}
        {activeTab === 'legal' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setLegalSubTab('terms')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${legalSubTab === 'terms'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Conditions d'Utilisation (CGU)
              </button>
              <button
                type="button"
                onClick={() => setLegalSubTab('privacy')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${legalSubTab === 'privacy'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Politique de Confidentialité
              </button>
            </div>

            {(() => {
              const currentDoc =
                tempContent.legal?.[legalSubTab] ||
                (legalSubTab === 'terms' ? DEFAULT_TERMS : DEFAULT_PRIVACY);

              const updateDocField = (field: keyof LegalDocumentContent, val: any) => {
                setTempContent(prev => ({
                  ...prev,
                  legal: {
                    terms: prev.legal?.terms || DEFAULT_TERMS,
                    privacy: prev.legal?.privacy || DEFAULT_PRIVACY,
                    [legalSubTab]: {
                      ...currentDoc,
                      [field]: val,
                    },
                  },
                }));
              };

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Badge</label>
                      <input
                        type="text"
                        value={currentDoc.badge || ''}
                        onChange={e => updateDocField('badge', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Titre</label>
                      <input
                        type="text"
                        value={currentDoc.title}
                        onChange={e => updateDocField('title', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Date de mise à jour
                      </label>
                      <input
                        type="text"
                        value={currentDoc.lastUpdated}
                        onChange={e => updateDocField('lastUpdated', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Sous-titre</label>
                      <input
                        type="text"
                        value={currentDoc.subtitle}
                        onChange={e => updateDocField('subtitle', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900">
                      Articles & Clauses ({(currentDoc.sections || []).length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleAddLegalSection(legalSubTab)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 border border-primary-200 rounded-xl text-sm font-bold hover:bg-primary-100"
                    >
                      <Plus size={16} /> Ajouter un article
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(currentDoc.sections || []).map(sec => (
                      <div
                        key={sec.id}
                        className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <input
                            type="text"
                            value={sec.title}
                            onChange={e =>
                              handleUpdateLegalSection(legalSubTab, sec.id, 'title', e.target.value)
                            }
                            placeholder="Titre de l'article (ex: 1. Objet)"
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveLegalSection(legalSubTab, sec.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Supprimer cet article"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <textarea
                          rows={4}
                          value={sec.content}
                          onChange={e =>
                            handleUpdateLegalSection(legalSubTab, sec.id, 'content', e.target.value)
                          }
                          placeholder="Contenu de l'article..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">
                              Encadré de mise en avant
                            </label>
                            <select
                              value={sec.calloutType || 'none'}
                              onChange={e =>
                                handleUpdateLegalSection(
                                  legalSubTab,
                                  sec.id,
                                  'calloutType',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                            >
                              <option value="none">Aucun encadré</option>
                              <option value="info">Encadré Info (Bleu)</option>
                              <option value="success">Encadré Succès (Vert)</option>
                            </select>
                          </div>
                          {sec.calloutType && sec.calloutType !== 'none' && (
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                                Texte de l'encadré
                              </label>
                              <input
                                type="text"
                                value={sec.calloutText || ''}
                                onChange={e =>
                                  handleUpdateLegalSection(
                                    legalSubTab,
                                    sec.id,
                                    'calloutText',
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ============================================================
            TAB: FREE ACCESS RULES
        ============================================================ */}
        {activeTab === 'free_access' && (
          <div className="space-y-8 max-w-3xl">
            <div className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Gift size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Configuration de l'Accès Gratuit Quotidien
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Définissez combien de vidéos gratuites un élève non-abonné peut regarder chaque jour par matière,
                    ainsi que la durée de validité de cet accès gratuit.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={tempContent.freeAccess.isEnabled}
                  onChange={e =>
                    setTempContent(prev => ({
                      ...prev,
                      freeAccess: { ...prev.freeAccess, isEnabled: e.target.checked },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <label className="block text-sm font-bold text-slate-800">
                  Nombre de vidéos gratuites / matière / jour
                </label>
                <p className="text-xs text-slate-500">
                  Par défaut : <strong>1 vidéo par matière chaque jour</strong>. Dès que cette limite est atteinte,
                  l'élève est invité à passer au plan Premium ou à revenir le lendemain.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={tempContent.freeAccess.videosPerSubjectPerDay}
                    onChange={e =>
                      setTempContent(prev => ({
                        ...prev,
                        freeAccess: {
                          ...prev.freeAccess,
                          videosPerSubjectPerDay: Math.max(0, parseInt(e.target.value || '0', 10)),
                        },
                      }))
                    }
                    className="w-28 px-4 py-2.5 text-lg font-extrabold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-sm font-semibold text-slate-600">vidéo(s) / matière / jour</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <label className="block text-sm font-bold text-slate-800">
                  Durée de la période d'essai gratuit
                </label>
                <p className="text-xs text-slate-500">
                  Choisissez si l'accès quotidien gratuit est permanent (illimité dans le temps) ou limité à un nombre
                  de jours après l'inscription de l'élève.
                </p>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="freeDurationMode"
                      checked={tempContent.freeAccess.durationDays === null}
                      onChange={() =>
                        setTempContent(prev => ({
                          ...prev,
                          freeAccess: { ...prev.freeAccess, durationDays: null },
                        }))
                      }
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    Illimité (Permanent)
                  </label>

                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="freeDurationMode"
                      checked={tempContent.freeAccess.durationDays !== null}
                      onChange={() =>
                        setTempContent(prev => ({
                          ...prev,
                          freeAccess: {
                            ...prev.freeAccess,
                            durationDays: prev.freeAccess.durationDays || 14,
                          },
                        }))
                      }
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    Limité en jours
                  </label>
                </div>

                {tempContent.freeAccess.durationDays !== null && (
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={tempContent.freeAccess.durationDays}
                      onChange={e =>
                        setTempContent(prev => ({
                          ...prev,
                          freeAccess: {
                            ...prev.freeAccess,
                            durationDays: Math.max(1, parseInt(e.target.value || '7', 10)),
                          },
                        }))
                      }
                      className="w-28 px-4 py-2 text-base font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm font-semibold text-slate-600">jours après l'inscription</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB: PAYMENT GATEWAYS (STRIPE, MONCASH, NATCASH)
        ============================================================ */}
        {activeTab === 'payment_gateways' && (
          <div className="space-y-8 max-w-4xl">
            <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                  <RefreshCw size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Taux de Change USD → HTG (Gourdes Haïtiennes)</h4>
                  <p className="text-xs text-slate-400">
                    Utilisé pour convertir automatiquement le prix des plans en Gourdes pour MonCash et NatCash.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/15">
                <span className="text-xs font-bold text-slate-300">1 USD =</span>
                <input
                  type="number"
                  min={1}
                  value={tempContent.paymentGateways.exchangeRateHTG}
                  onChange={e =>
                    setTempContent(prev => ({
                      ...prev,
                      paymentGateways: {
                        ...prev.paymentGateways,
                        exchangeRateHTG: Math.max(1, parseFloat(e.target.value || '132')),
                      },
                    }))
                  }
                  className="w-20 bg-transparent text-white font-extrabold text-base text-center focus:outline-none border-b border-amber-400"
                />
                <span className="text-xs font-bold text-amber-400">HTG</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stripe Card */}
              <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Stripe</h4>
                        <span className="text-[11px] text-slate-500">Carte Bancaire (Visa / MC)</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tempContent.paymentGateways.stripe.isEnabled}
                      onChange={e =>
                        setTempContent(prev => ({
                          ...prev,
                          paymentGateways: {
                            ...prev.paymentGateways,
                            stripe: { ...prev.paymentGateways.stripe, isEnabled: e.target.checked },
                          },
                        }))
                      }
                      className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Clé Publique Stripe (Publishable Key)
                    </label>
                    <input
                      type="text"
                      placeholder="pk_live_... ou pk_test_..."
                      value={tempContent.paymentGateways.stripe.publishableKey}
                      onChange={e =>
                        setTempContent(prev => ({
                          ...prev,
                          paymentGateways: {
                            ...prev.paymentGateways,
                            stripe: { ...prev.paymentGateways.stripe, publishableKey: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempContent.paymentGateways.stripe.allowRecurring}
                        onChange={e =>
                          setTempContent(prev => ({
                            ...prev,
                            paymentGateways: {
                              ...prev.paymentGateways,
                              stripe: { ...prev.paymentGateways.stripe, allowRecurring: e.target.checked },
                            },
                          }))
                        }
                        className="rounded text-indigo-600"
                      />
                      Autoriser le renouvellement mensuel auto
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempContent.paymentGateways.stripe.allowPrepaid}
                        onChange={e =>
                          setTempContent(prev => ({
                            ...prev,
                            paymentGateways: {
                              ...prev.paymentGateways,
                              stripe: { ...prev.paymentGateways.stripe, allowPrepaid: e.target.checked },
                            },
                          }))
                        }
                        className="rounded text-indigo-600"
                      />
                      Autoriser les paiements prépayés (1, 3, 6, 12 mois)
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck size={14} className="text-indigo-500" /> Paiement sécurisé SSL 256-bit
                </div>
              </div>

              {/* MonCash Card */}
              <div className="rounded-2xl border border-red-200 p-6 bg-red-50/20 shadow-sm flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-extrabold text-xs shadow-sm overflow-hidden">
                        {tempContent.paymentGateways.moncash.logoUrl ? (
                          <img
                            src={tempContent.paymentGateways.moncash.logoUrl}
                            alt="MonCash"
                            className="w-full h-full object-contain bg-white p-1"
                          />
                        ) : (
                          'MC'
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">MonCash (Digicel)</h4>
                        <span className="text-[11px] text-red-600 font-semibold">Mobile Money Haïti</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tempContent.paymentGateways.moncash.isEnabled}
                      onChange={e =>
                        setTempContent(prev => ({
                          ...prev,
                          paymentGateways: {
                            ...prev.paymentGateways,
                            moncash: { ...prev.paymentGateways.moncash, isEnabled: e.target.checked },
                          },
                        }))
                      }
                      className="w-5 h-5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Logo MonCash (URL ou Upload)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="https://... ou choisir une image"
                        value={tempContent.paymentGateways.moncash.logoUrl || ''}
                        onChange={e =>
                          setTempContent(prev => ({
                            ...prev,
                            paymentGateways: {
                              ...prev.paymentGateways,
                              moncash: { ...prev.paymentGateways.moncash, logoUrl: e.target.value },
                            },
                          }))
                        }
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <label className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1 shrink-0">
                        <Camera size={13} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              setTempContent(prev => ({
                                ...prev,
                                paymentGateways: {
                                  ...prev.paymentGateways,
                                  moncash: {
                                    ...prev.paymentGateways.moncash,
                                    logoUrl: reader.result as string,
                                  },
                                },
                              }));
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Numéro Marchand / Agent MonCash
                    </label>
                    <input
                      type="text"
                      value={tempContent.paymentGateways.moncash.merchantNumber}
                      onChange={e =>
                        setTempContent(prev => ({
                          ...prev,
                          paymentGateways: {
                            ...prev.paymentGateways,
                            moncash: { ...prev.paymentGateways.moncash, merchantNumber: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nom du Bénéficiaire</label>
                    <input
                      type="text"
                      value={tempContent.paymentGateways.moncash.receiverName}
                      onChange={e =>
                        setTempContent(prev => ({
                          ...prev,
                          paymentGateways: {
                            ...prev.paymentGateways,
                            moncash: { ...prev.paymentGateways.moncash, receiverName: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Instructions affichées à l'élève
                    </label>
                    <textarea
                      rows={3}
                      value={tempContent.paymentGateways.moncash.instructions}
                      onChange={e =>
                        setTempContent(prev => ({
                          ...prev,
                          paymentGateways: {
                            ...prev.paymentGateways,
                            moncash: { ...prev.paymentGateways.moncash, instructions: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-red-100 flex items-center gap-1.5 text-[11px] text-red-600 font-medium">
                  <Smartphone size={14} /> Paiement prépayé (1, 3, 6 ou 12 mois)
                </div>
              </div>

              {/* NatCash Card */}
              <div className="rounded-2xl border border-blue-200 p-6 bg-blue-50/20 shadow-sm flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-xs shadow-sm overflow-hidden">
                        {tempContent.paymentGateways.natcash.logoUrl ? (
                          <img
                            src={tempContent.paymentGateways.natcash.logoUrl}
                            alt="NatCash"
                            className="w-full h-full object-contain bg-white p-1"
                          />
                        ) : (
                          'NC'
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">NatCash (Natcom)</h4>
                        <span className="text-[11px] text-blue-600 font-semibold">Mobile Money Haïti</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={tempContent.paymentGateways.natcash.isEnabled}
                      onChange={e =>
                        setTempContent(prev => ({
                          ...prev,
                          paymentGateways: {
                            ...prev.paymentGateways,
                            natcash: { ...prev.paymentGateways.natcash, isEnabled: e.target.checked },
                          },
                        }))
                      }
                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Logo NatCash (URL ou Upload)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="https://... ou choisir une image"
                        value={tempContent.paymentGateways.natcash.logoUrl || ''}
                        onChange={e =>
                          setTempContent(prev => ({
                            ...prev,
                            paymentGateways: {
                              ...prev.paymentGateways,
                              natcash: { ...prev.paymentGateways.natcash, logoUrl: e.target.value },
                            },
                          }))
                        }
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <label className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1 shrink-0">
                        <Camera size={13} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              setTempContent(prev => ({
                                ...prev,
                                paymentGateways: {
                                  ...prev.paymentGateways,
                                  natcash: {
                                    ...prev.paymentGateways.natcash,
                                    logoUrl: reader.result as string,
                                  },
                                },
                              }));
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Numéro Marchand / Agent NatCash
                    </label>
                    <input
                      type="text"
                      value={tempContent.paymentGateways.natcash.merchantNumber}
                      onChange={e =>
                        setTempContent(prev => ({
                          ...prev,
                          paymentGateways: {
                            ...prev.paymentGateways,
                            natcash: { ...prev.paymentGateways.natcash, merchantNumber: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nom du Bénéficiaire</label>
                    <input
                      type="text"
                      value={tempContent.paymentGateways.natcash.receiverName}
                      onChange={e =>
                        setTempContent(prev => ({
                          ...prev,
                          paymentGateways: {
                            ...prev.paymentGateways,
                            natcash: { ...prev.paymentGateways.natcash, receiverName: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Instructions affichées à l'élève
                    </label>
                    <textarea
                      rows={3}
                      value={tempContent.paymentGateways.natcash.instructions}
                      onChange={e =>
                        setTempContent(prev => ({
                          ...prev,
                          paymentGateways: {
                            ...prev.paymentGateways,
                            natcash: { ...prev.paymentGateways.natcash, instructions: e.target.value },
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-blue-100 flex items-center gap-1.5 text-[11px] text-blue-600 font-medium">
                  <Smartphone size={14} /> Paiement prépayé (1, 3, 6 ou 12 mois)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};