<?php
require_once __DIR__ . '/partials/header.php';
require_once __DIR__ . '/partials/navigation.php';
?>
<main class="site-main">
    <section id="framework" class="content-section">
        <?php require_once __DIR__ . '/pages/framework.php'; ?>
    </section>
    <section id="wireframe" class="content-section alt">
        <?php require_once __DIR__ . '/pages/wireframe.php'; ?>
    </section>
    <section id="learning-journey" class="content-section">
        <?php require_once __DIR__ . '/pages/learning_journey.php'; ?>
    </section>
    <section id="resources" class="content-section alt">
        <?php require_once __DIR__ . '/pages/resources.php'; ?>
    </section>
    <section id="support" class="content-section">
        <?php require_once __DIR__ . '/pages/support.php'; ?>
    </section>
</main>
<?php
require_once __DIR__ . '/partials/footer.php';
?>
