<article class="card" data-tags="<?php echo htmlspecialchars(implode(' ', $story['tags'])); ?>">
    <header class="card__header">
        <span class="card__source"><?php echo htmlspecialchars($story['source']); ?></span>
        <time datetime="<?php echo htmlspecialchars($story['published_at']); ?>"><?php echo date('d/m H:i', strtotime($story['published_at'])); ?></time>
    </header>
    <h3 class="card__title">
        <a href="<?php echo htmlspecialchars($story['url']); ?>" target="_blank" rel="noopener">
            <?php echo htmlspecialchars($story['title']); ?>
        </a>
    </h3>
    <p class="card__summary"><?php echo htmlspecialchars($story['summary']); ?></p>
    <footer class="card__footer">
        <?php foreach ($story['tags'] as $tag): ?>
            <span class="badge">#<?php echo htmlspecialchars($tag); ?></span>
        <?php endforeach; ?>
        <a class="read-more" href="<?php echo htmlspecialchars($story['url']); ?>" target="_blank" rel="noopener">Læs →</a>
    </footer>
</article>
