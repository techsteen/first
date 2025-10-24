<?php
require_once __DIR__ . '/partials/header.php';
require_once __DIR__ . '/partials/navigation.php';
?>
<main class="site-main">
    <section id="intro" class="content-section">
        <?php require_once __DIR__ . '/pages/training/intro.php'; ?>
    </section>
    <section id="step1" class="content-section alt">
        <?php require_once __DIR__ . '/pages/training/step1.php'; ?>
    </section>
    <section id="step2" class="content-section">
        <?php require_once __DIR__ . '/pages/training/step2.php'; ?>
    </section>
    <section id="step3" class="content-section alt">
        <?php require_once __DIR__ . '/pages/training/step3.php'; ?>
    </section>
    <section id="practice" class="content-section">
        <?php require_once __DIR__ . '/pages/training/practice.php'; ?>
    </section>
    <section id="evaluation" class="content-section alt">
        <?php require_once __DIR__ . '/pages/training/evaluation.php'; ?>
    </section>
</main>
<?php
require_once __DIR__ . '/partials/footer.php';
?>
