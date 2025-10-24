<?php
$modules = require __DIR__ . '/modules_data.php';
?>
<article class="section-content">
    <h2>Trin-for-trin AD-DS forløb</h2>
    <p>
        Forløbet er opdelt i tre overskuelige trin, der hver kombinerer korte oplæg, guidede simuleringer
        og praksisnære opgaver. Eleverne arbejder sammen med underviseren i klasselabbet og kan hele tiden
        markere elementer for at få hjælp fra ChatGPT-integrationens kontekstforklaringer. Brug
        checklisterne til at holde styr på progressionen, og fold <em>Detaljeret plan</em> ud for at se
        alle aktiviteterne.
    </p>
    <div class="module-grid">
        <?php foreach ($modules as $module): ?>
            <?php
            $moduleId = htmlspecialchars($module['id']);
            $progressId = 'progress-' . $moduleId;
            ?>
            <section class="module-card" id="module-<?php echo $moduleId; ?>" data-module-id="<?php echo $moduleId; ?>">
                <header class="module-header">
                    <div>
                        <h3><?php echo htmlspecialchars($module['title']); ?></h3>
                        <p class="module-summary-text"><?php echo htmlspecialchars($module['summary']); ?></p>
                    </div>
                    <div class="module-meta">
                        <span class="module-duration">Varighed: <?php echo htmlspecialchars($module['duration']); ?></span>
                        <span class="module-competency-count"><?php echo count($module['competencies']); ?> kompetencemål</span>
                    </div>
                </header>
                <div class="module-competencies" data-assist-topic="competencies">
                    <h4>Kompetencemål</h4>
                    <ul>
                        <?php foreach ($module['competencies'] as $competency): ?>
                            <li>
                                <span><?php echo htmlspecialchars($competency); ?></span>
                                <button type="button" class="assist-trigger" title="Få forklaring" data-assist-text="Forklar hvorfor dette kompetencemål er vigtigt: <?php echo htmlspecialchars($competency); ?>">
                                    ?
                                </button>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </div>
                <details class="module-details" data-module-details>
                    <summary>Detaljeret plan</summary>
                    <div class="module-columns">
                        <div class="module-column">
                            <h4>Lær</h4>
                            <ul>
                                <?php foreach ($module['activities']['learn'] as $item): ?>
                                    <li>
                                        <span><?php echo htmlspecialchars($item['text']); ?></span>
                                        <button type="button" class="assist-trigger" data-assist-text="<?php echo htmlspecialchars($item['assist']); ?>" title="Få hjælp">
                                            ?
                                        </button>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                        <div class="module-column">
                            <h4>Simuleringer</h4>
                            <?php foreach ($module['activities']['simulate'] as $sim): ?>
                                <article class="module-scenario" data-assist-topic="simulation">
                                    <header>
                                        <h5><?php echo htmlspecialchars($sim['title']); ?></h5>
                                        <p><?php echo htmlspecialchars($sim['description']); ?></p>
                                    </header>
                                    <div class="module-scenario-body">
                                        <h6>Trin-for-trin</h6>
                                        <ol>
                                            <?php foreach ($sim['steps'] as $step): ?>
                                                <li>
                                                    <span><?php echo htmlspecialchars($step); ?></span>
                                                    <button type="button" class="assist-trigger" data-assist-text="Forklar dette trin: <?php echo htmlspecialchars($step); ?>" title="Få hjælp">?</button>
                                                </li>
                                            <?php endforeach; ?>
                                        </ol>
                                        <?php if (!empty($sim['checkpoints'])): ?>
                                            <h6>Checkpoints</h6>
                                            <ul class="module-checkpoints">
                                                <?php foreach ($sim['checkpoints'] as $checkpoint): ?>
                                                    <li><?php echo htmlspecialchars($checkpoint); ?></li>
                                                <?php endforeach; ?>
                                            </ul>
                                        <?php endif; ?>
                                        <button type="button" class="assist-trigger secondary" data-assist-text="<?php echo htmlspecialchars($sim['assist']); ?>">Forklar scenariet</button>
                                    </div>
                                </article>
                            <?php endforeach; ?>
                        </div>
                        <div class="module-column">
                            <h4>Reallife</h4>
                            <?php foreach ($module['activities']['real_life'] as $real): ?>
                                <article class="module-real">
                                    <h5><?php echo htmlspecialchars($real['title']); ?></h5>
                                    <ul>
                                        <?php foreach ($real['tasks'] as $task): ?>
                                            <li>
                                                <span><?php echo htmlspecialchars($task); ?></span>
                                                <button type="button" class="assist-trigger" data-assist-text="Hjælp til opgave: <?php echo htmlspecialchars($task); ?>">?</button>
                                            </li>
                                        <?php endforeach; ?>
                                    </ul>
                                    <button type="button" class="assist-trigger secondary" data-assist-text="<?php echo htmlspecialchars($real['assist']); ?>">Forklar denne aktivitet</button>
                                </article>
                            <?php endforeach; ?>
                            <div class="module-reflection">
                                <h5>Refleksion</h5>
                                <ul>
                                    <?php foreach ($module['activities']['reflection'] as $reflection): ?>
                                        <li>
                                            <span><?php echo htmlspecialchars($reflection); ?></span>
                                            <button type="button" class="assist-trigger" data-assist-text="Giv en mulig refleksion på spørgsmålet: <?php echo htmlspecialchars($reflection); ?>">?</button>
                                        </li>
                                    <?php endforeach; ?>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="module-progress" id="<?php echo $progressId; ?>" data-progress-module="<?php echo $moduleId; ?>">
                        <div class="module-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>
                        <span class="module-progress-text">0% gennemført</span>
                    </div>
                    <div class="module-checklist" role="group" aria-labelledby="checklist-<?php echo $moduleId; ?>">
                        <h4 id="checklist-<?php echo $moduleId; ?>">Progressionstjek</h4>
                        <?php foreach ($module['checkpoints'] as $checkpoint): ?>
                            <?php $taskKey = $moduleId . '-' . $checkpoint['id']; ?>
                            <label class="module-task">
                                <input type="checkbox" data-progress-key="<?php echo htmlspecialchars($taskKey); ?>">
                                <span><?php echo htmlspecialchars($checkpoint['label']); ?></span>
                            </label>
                        <?php endforeach; ?>
                    </div>
                    <div class="module-rubric">
                        <h4>Evalueringsrubric</h4>
                        <table>
                            <thead>
                                <tr>
                                    <th>Kriterium</th>
                                    <th>Begynder</th>
                                    <th>På vej</th>
                                    <th>Sikker</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($module['rubric']['criteria'] as $criterion): ?>
                                    <tr>
                                        <th scope="row"><?php echo htmlspecialchars($criterion['name']); ?></th>
                                        <td><?php echo htmlspecialchars($criterion['beginner']); ?></td>
                                        <td><?php echo htmlspecialchars($criterion['developing']); ?></td>
                                        <td><?php echo htmlspecialchars($criterion['proficient']); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                    <div class="module-resources">
                        <h4>Materialer</h4>
                        <ul>
                            <?php foreach ($module['resources'] as $resource): ?>
                                <li>
                                    <a href="<?php echo htmlspecialchars($resource['path']); ?>" target="_blank" rel="noopener" data-resource-link><?php echo htmlspecialchars($resource['label']); ?></a>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                </details>
            </section>
        <?php endforeach; ?>
    </div>
</article>
