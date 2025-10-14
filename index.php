<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Subnetting Forklaring</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="assets/styles.css" />
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
  <div id="app" class="py-6 px-4 md:px-8 lg:px-12 w-full">
    <header class="mb-6 text-center">
      <h1 class="text-3xl font-bold text-indigo-900">Subnetting Forklaring</h1>
      <p class="text-gray-600 text-sm">Hvorfor og hvordan opdeler vi netværk?</p>
    </header>
    <section id="progress" class="mb-4"></section>
    <section id="visualization" class="bg-white rounded-xl shadow-lg p-4 md:p-6 min-h-[520px] overflow-x-hidden w-full"></section>
    <section id="calculator" class="mt-4"></section>
    <footer class="mt-4 flex flex-wrap gap-3 items-center justify-between">
      <button id="prev-step" class="btn" type="button">← Forrige</button>
      <div id="step-indicator" class="text-sm font-semibold text-gray-600"></div>
      <button id="next-step" class="btn-primary" type="button">Næste →</button>
    </footer>
  </div>
  <footer class="site-footer">
    <p class="site-footer__text">Steen Hansen - Techcollege</p>
  </footer>
  <script src="assets/app.js"></script>
</body>
</html>
