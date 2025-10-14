<?php
// Gem din OpenAI API-nøgle her og sørg for, at filen ikke er tilgængelig fra webserverens dokumentrod.
$OPENAI_API_KEY = 'SK-ERSTAT-MED-DIN-NØGLE';

// Domæner der må sende forespørgsler til proxyen.
$ALLOWED_REFERERS = [
    'http://localhost',
    'https://localhost'
];

// Tilladte emner og nøgleord for moderationen.
$ALLOWED_TOPICS = [
    'ai',
    'undervisning',
    'differentiering',
    'didaktik',
    'netværk',
    'programmering',
    'prompting',
    'dhcp',
    'dns',
    'kritisk tænkning',
    'læring',
    'dannelse',
    'feedback'
];
