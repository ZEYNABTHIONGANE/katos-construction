
/**
 * Service pour l'assistant de conseil en immobilier et BTP (Katos Conseil)
 */

export interface AdviceResponse {
    text: string;
    suggestions?: string[];
}

class BTPAdviceService {
    private readonly botName = "Katos Expert";

    private readonly knowledgeBase: { [key: string]: AdviceResponse } = {
        "fondation": {
            text: "Les fondations sont l'étape la plus cruciale. Pour une villa au Sénégal, nous recommandons généralement des fondations en béton armé adaptées au type de sol (sableux ou argileux). Une étude de sol est fortement conseillée.",
            suggestions: ["Prix des fondations", "Étude de sol", "Prochaine étape"]
        },
        "devis": {
            text: "Le coût d'une construction dépend de nombreux facteurs (surface, finitions, localisation). Chez Katos, nous fournissons un devis détaillé après une première étude technique gratuite.",
            suggestions: ["Prendre RDV", "Modèles de villas", "Financement"]
        },
        "permis": {
            text: "Pour construire au Sénégal, vous devez obtenir une autorisation de construire. Nous vous accompagnons dans toutes les démarches administratives pour l'obtention de ce précieux sésame.",
            suggestions: ["Documents requis", "Délais", "Coût du permis"]
        },
        "parpaing": {
            text: "Nous utilisons généralement des parpaings de 15 pour les murs extérieurs et de 10 pour les cloisons. La qualité du dosage en ciment est surveillée de près par nos chefs de chantier.",
            suggestions: ["Ciment utilisé", "Dosage béton"]
        },
        "dalle": {
            text: "Le coulage de la dalles nécessite une préparation minutieuse : ferraillage, coffrage et surtout un temps de séchage (cure) de 21 jours pour une résistance optimale.",
            suggestions: ["Étanchéité", "Finition sol"]
        },
        "terrain": {
            text: "Avant d'acheter un terrain au Sénégal, vérifiez impérativement la nature du titre (Titre Foncier, Bail, ou Délibération). Demandez un état réel récent au bureau de la conservation foncière pour s'assurer qu'il n'y a aucune hypothèque.",
            suggestions: ["Vérifier NICAD", "Notaire", "Taxe foncière"]
        },
        "foncier": {
            text: "La vérification foncière se fait aux Impôts et Domaines. Munissez-vous du numéro de NICAD ou du titre pour vérifier l'identité du propriétaire réel et la surface exacte.",
            suggestions: ["Titre Foncier", "Bail", "Commune"]
        },
        "notaire": {
            text: "Le passage devant notaire est obligatoire pour toute transaction portant sur un Titre Foncier ou un Bail. C'est lui qui garantit la sécurité juridique de votre investissement.",
            suggestions: ["Frais de notaire", "Acte de vente"]
        },
        "orientation": {
            text: "Pour une construction économe en énergie, orientez vos ouvertures au Nord et au Sud pour éviter l'ensoleillement direct. Privilégiez la ventilation naturelle traversante pour réduire l'usage de la climatisation.",
            suggestions: ["Matériaux isolants", "Toiture"]
        },
        "nicad": {
            text: "Le NICAD (Numéro d'Identification Cadastrale) est l'immatriculation unique de votre parcelle. Il est indispensable pour payer vos taxes et pour toute démarche administrative foncière.",
            suggestions: ["Impôts et Domaines", "Plan cadastral"]
        },
        "finition": {
            text: "Les finitions (carrelage, peinture, menuiserie) représentent environ 30% du budget. C'est l'étape qui donne tout son cachet à votre villa. Nous proposons différents niveaux de finition, du standard au haut de gamme.",
            suggestions: ["Types de carrelage", "Peinture intérieure", "Budget finitions"]
        },
        "construction": {
            text: "La construction d'une villa avec Katos suit un processus rigoureux : gros œuvre, second œuvre et finitions. Nous assurons un suivi hebdomadaire avec photos pour que vous puissiez suivre l'avancement à distance.",
            suggestions: ["Délais de construction", "Garantie décennale", "Nos réalisations"]
        },
        "architecture": {
            text: "Nos architectes conçoivent des plans modernes et optimisés pour le climat tropical. Vous pouvez choisir l'un de nos modèles ou opter pour une conception sur-mesure selon vos besoins.",
            suggestions: ["Plans 3D", "Modification de plan", "Permis de construire"]
        },
        "btp": {
            text: "Le BTP au Sénégal est en pleine mutation. Katos Construction s'engage sur la qualité des matériaux et le respect des normes de sécurité pour assurer la pérennité de votre investissement.",
            suggestions: ["Normes de sécurité", "Qualité matériaux"]
        },
        "default": {
            text: "Désolé, je suis un assistant spécialisé uniquement dans le BTP, la construction et l'immobilier au Sénégal. Je ne peux pas vous répondre sur d'autres sujets. Auriez-vous une question concernant votre projet de maison ou de terrain ?",
            suggestions: ["Construire une villa", "Acheter un terrain", "Finitions", "Prix devis"]
        }
    };

    /**
     * Analyse le message de l'utilisateur et retourne une réponse adaptée
     */
    async getResponse(message: string): Promise<AdviceResponse> {
        const lowerMessage = message.toLowerCase();

        // Simuler un temps de réflexion du bot (humain)
        await new Promise(resolve => setTimeout(resolve, 1500));

        for (const key in this.knowledgeBase) {
            if (lowerMessage.includes(key)) {
                return this.knowledgeBase[key];
            }
        }

        return this.knowledgeBase["default"];
    }

    getBotName(): string {
        return this.botName;
    }
}

export const btpAdviceService = new BTPAdviceService();
