// Petit pack d'exemple, écrit pour ActorHub. Sans vidéo : celles-ci viendront de la collecte Apify.
import type { ResourcePack } from "./schema";

export const SAMPLE_PACK: ResourcePack = {
  version: 1,
  language: "en",
  name: "Exemple : voyage (A1 à B2)",
  vocabulary: [
    { id: "v-001", word: "luggage", pos: "noun", level: "A1", meaningFr: "bagages", example: "My luggage is very heavy.", themes: ["travel"] },
    { id: "v-002", word: "passport", pos: "noun", level: "A1", meaningFr: "passeport", example: "Don't forget your passport.", themes: ["travel"] },
    { id: "v-003", word: "ticket", pos: "noun", level: "A1", meaningFr: "billet", example: "I bought two train tickets.", themes: ["travel"] },
    { id: "v-004", word: "beach", pos: "noun", level: "A1", meaningFr: "plage", example: "We spent the day on the beach.", themes: ["travel", "landscapes"] },
    { id: "v-005", word: "mountain", pos: "noun", level: "A1", meaningFr: "montagne", example: "The mountain is covered with snow.", themes: ["landscapes"] },
    { id: "v-006", word: "departure", pos: "noun", level: "A2", meaningFr: "départ", example: "The departure is at eight o'clock.", themes: ["travel"] },
    { id: "v-007", word: "arrival", pos: "noun", level: "A2", meaningFr: "arrivée", example: "Our arrival time is 6 p.m.", themes: ["travel"] },
    { id: "v-008", word: "delay", pos: "noun", level: "A2", meaningFr: "retard", example: "There is a delay because of the weather.", themes: ["travel"] },
    { id: "v-009", word: "journey", pos: "noun", level: "A2", meaningFr: "trajet, voyage", example: "The journey took five hours.", themes: ["travel"] },
    { id: "v-010", word: "view", pos: "noun", level: "A2", meaningFr: "vue", example: "The room has a lovely view of the sea.", themes: ["travel", "landscapes"] },
    { id: "v-011", word: "to book", pos: "verb", level: "A2", meaningFr: "réserver", example: "I want to book a table for two.", themes: ["travel"] },
    { id: "v-012", word: "to pack", pos: "verb", level: "A2", meaningFr: "faire ses valises", example: "I always pack the night before.", themes: ["travel"] },
    { id: "v-013", word: "scenery", pos: "noun", level: "B1", meaningFr: "paysage, décor naturel", example: "The scenery in this region is stunning.", themes: ["landscapes"] },
    { id: "v-014", word: "to check in", pos: "phrasal verb", level: "B1", meaningFr: "s'enregistrer", example: "You can check in online.", themes: ["travel"] },
    { id: "v-015", word: "boarding gate", pos: "noun", level: "B1", meaningFr: "porte d'embarquement", example: "Please go to boarding gate 12.", themes: ["travel"] },
    { id: "v-016", word: "itinerary", pos: "noun", level: "B1", meaningFr: "itinéraire, programme de voyage", example: "Our itinerary includes three cities.", themes: ["travel"] },
    { id: "v-017", word: "to take off", pos: "phrasal verb", level: "B1", meaningFr: "décoller", example: "The plane takes off in ten minutes.", themes: ["travel"] },
    { id: "v-018", word: "sightseeing", pos: "noun", level: "B1", meaningFr: "visite touristique", example: "We went sightseeing all afternoon.", themes: ["travel"] },
    { id: "v-019", word: "breathtaking", pos: "adjective", level: "B2", meaningFr: "à couper le souffle", example: "The view from the top was breathtaking.", themes: ["landscapes"] },
    { id: "v-020", word: "off the beaten track", pos: "idiom", level: "B2", meaningFr: "hors des sentiers battus", example: "We prefer villages off the beaten track.", themes: ["travel"] },
    { id: "v-021", word: "to get away from it all", pos: "idiom", level: "B2", meaningFr: "s'évader, tout laisser derrière soi", example: "I need a week to get away from it all.", themes: ["travel"] },
  ],
  grammar: [
    {
      id: "g-001",
      level: "A1",
      title: "Le présent simple",
      summaryFr:
        "Le présent simple décrit les habitudes, les faits et les vérités générales (I work every day. The sun rises in the east.). Avec he, she et it, on ajoute -s au verbe (she works). Pour la négation, on utilise do not / does not + verbe à l'infinitif ; pour la question, Do / Does + sujet + verbe.",
      rules: [
        "I / you / we / they + verbe : I live in Lomé.",
        "he / she / it + verbe + s : She lives in Kara.",
        "Négation : do not (don't) / does not (doesn't) + verbe : He doesn't like fish.",
        "Question : Do / Does + sujet + verbe : Does she work here?",
      ],
      examples: ["I work in an office.", "She works in a hospital.", "We don't live in the city.", "Does he speak English?"],
      exercises: [
        { type: "choice", question: "She ___ to school every day.", options: ["go", "goes", "going"], answer: 1, explanation: "Avec she, on ajoute -s : goes." },
        { type: "choice", question: "They ___ coffee in the morning.", options: ["don't drink", "doesn't drink", "not drink"], answer: 0, explanation: "Négation avec they : don't + verbe." },
        { type: "fill", prompt: "He ___ like fish. (négation)", answer: "doesn't", alternatives: ["does not"], explanation: "Négation avec he : doesn't / does not." },
        { type: "fill", prompt: "___ you speak English?", answer: "Do", alternatives: [], explanation: "Question avec you : Do." },
      ],
    },
    {
      id: "g-002",
      level: "B1",
      title: "Le present perfect",
      summaryFr:
        "Le present perfect (have / has + participe passé) relie le passé au présent : une expérience (I have visited Paris), un résultat visible maintenant (I have lost my keys) ou une durée avec for / since (I have lived here for two years). On ne l'emploie pas avec un moment précis du passé (yesterday, in 2019) : on utilise alors le prétérit.",
      rules: [
        "Forme : have / has + participe passé.",
        "for + durée : for three years ; since + point de départ : since 2020.",
        "Avec une date précise, on utilise le prétérit : I saw him yesterday.",
      ],
      examples: ["I have visited three countries.", "She has lived here since 2020.", "Have you ever eaten mango?", "We haven't seen that film yet."],
      exercises: [
        { type: "choice", question: "I ___ in Lomé for ten years.", options: ["live", "have lived", "lived"], answer: 1, explanation: "Durée avec for : present perfect." },
        { type: "choice", question: "We ___ Paris last summer.", options: ["have visited", "visited", "visit"], answer: 1, explanation: "« last summer » est un moment précis : prétérit." },
        { type: "fill", prompt: "She has ___ that film already. (see)", answer: "seen", alternatives: [], explanation: "Participe passé de see : seen." },
      ],
    },
  ],
  videos: [],
  readings: [
    {
      id: "r-001",
      title: "A weekend by the sea",
      level: "A2",
      theme: "travel",
      text: "Last summer, my family spent a weekend by the sea. We stayed in a small hotel near the beach. In the morning, we walked along the water and took many photos. In the afternoon, we ate fresh fish in a restaurant with a beautiful view. The weather was sunny, but the evening was cool. On Sunday, our train was late, so we had time for one more coffee. It was a simple weekend, and we loved it.",
    },
  ],
  pronunciation: [
    {
      id: "p-001",
      title: "Le son « th »",
      level: "A2",
      tipFr:
        "Ce son n'existe pas en français. Place le bout de la langue entre les dents. Pour /θ/ (think, thank, three), souffle sans faire vibrer la gorge. Pour /ð/ (this, that, the), fais vibrer la gorge. Évite de le remplacer par /s/, /z/ ou /d/ : think ne se prononce pas sink.",
      examples: ["think", "thank", "three", "this", "that", "the", "brother", "weather"],
    },
    {
      id: "p-002",
      title: "Les terminaisons -ed",
      level: "A2",
      tipFr:
        "Le -ed du passé se prononce de trois façons : /t/ après un son sourd (walked, helped), /d/ après un son voisé (played, called), /ɪd/ après t ou d (wanted, needed). Ce n'est pas toujours une syllabe en plus.",
      examples: ["walked", "helped", "played", "called", "wanted", "needed"],
    },
  ],
};