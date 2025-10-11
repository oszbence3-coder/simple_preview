function Standard(osu, entries)
{
    Beatmap.call(this, osu);

    this.entries = entries;



    if (this.Colors.length)
    {
        this.Colors.push(this.Colors.shift());
    }
    else
    {
        this.Colors = Standard.DEFAULT_COLORS;
    }

    var combo = 1,
        comboIndex = -1,
        setComboIndex = 1;
    for (var i = 0; i < this.HitObjects.length; i++)
    {
        var hitObject = this.HitObjects[i];
        if (hitObject instanceof Spinner)
        {
            setComboIndex = 1;
        }
        else if (hitObject.newCombo || setComboIndex)
        {
            combo = 1;
            comboIndex = ((comboIndex + 1) + hitObject.comboSkip) % this.Colors.length;
            setComboIndex = 0;
        }
        hitObject.combo = combo++;
        hitObject.color = this.Colors[comboIndex];
    }


    // calculate stacks
    // https://gist.github.com/peppy/1167470
    for (var i = this.HitObjects.length - 1; i > 0; i--)
    {
        var hitObject = this.HitObjects[i];
        if (hitObject.stack != 0 || hitObject instanceof Spinner)
        {
            continue;
        }

        for (var n = i - 1; n >= 0; n--)
        {
            var hitObjectN = this.HitObjects[n];
            if (hitObjectN instanceof Spinner)
            {
                continue;
            }

            if (hitObject.time - hitObjectN.endTime > this.approachTime * this.StackLeniency)
            {
                break;
            }

            if (hitObject.position.distanceTo(hitObjectN.endPosition) < Standard.STACK_LENIENCE)
            {
                if (hitObjectN instanceof Slider)
                {
                    var offset = hitObject.stack - hitObjectN.stack + 1;
                    for (var j = n + 1; j <= i; j++)
                    {
                        var hitObjectJ = this.HitObjects[j];
                        if (hitObjectJ.position.distanceTo(hitObjectN.endPosition) < Standard.STACK_LENIENCE)
                        {
                            hitObjectJ.stack -= offset;
                        }
                    }
                    break;
                }

                hitObjectN.stack = hitObject.stack + 1;
                hitObject = hitObjectN;
            }
        }
    }

    this.circleRadius = this.circleDiameter / 2;
    this.circleBorder = this.circleRadius / 8;
    this.shadowBlur = this.circleRadius / 15;

    // Initialize audio context for hitsounds
    try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.hitsoundBuffers = {};
        this.playedHitsounds = new Set();
    } catch (e) {
        console.warn('Web Audio API not supported:', e);
        this.audioContext = null;
    }
}
Standard.prototype.loadHitsounds = function() {
    if (!this.audioContext) return;

    console.log('Loading hitsounds...');

    // Try to load from beatmap archive first
    if (this.entries) {
        const hitsoundFiles = [
            'normal-hitnormal.wav',
            'normal-hitclap.wav',
            'normal-hitfinish.wav',
            'normal-hitwhistle.wav'
        ];

        for (const filename of hitsoundFiles) {
            console.log('Looking for:', filename);
            const entry = this.entries.find(e => e.filename.toLowerCase() === filename.toLowerCase());
            if (entry) {
                console.log('Found entry:', entry.filename);
                entry.getData(new zip.BlobWriter('audio/wav')).then(blob => {
                    blob.arrayBuffer().then(arrayBuffer => {
                        this.audioContext.decodeAudioData(arrayBuffer).then(audioBuffer => {
                            this.hitsoundBuffers[filename.split('.')[0]] = audioBuffer;
                            console.log('Loaded hitsound from archive:', filename);
                        }).catch(e => console.warn('Failed to decode hitsound:', filename, e));
                    }).catch(e => console.warn('Failed to get array buffer for hitsound:', filename, e));
                }).catch(e => console.warn('Failed to load hitsound:', filename, e));
            }
        }
    }

    // Fallback: Generate a simple beep sound
    this.generateDefaultHitsound();
};

Standard.prototype.generateDefaultHitsound = function() {
    if (!this.audioContext) return;

    // Create a simple beep sound (880Hz sine wave - higher pitch)
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.15; // 150ms - longer
    const bufferSize = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        const t = i / sampleRate;
        // Sine wave with envelope
        const envelope = Math.exp(-t * 15); // Slower decay
        channelData[i] = Math.sin(2 * Math.PI * 880 * t) * envelope * 1.0; // Higher frequency, maximum volume
    }

    this.hitsoundBuffers['normal-hitnormal'] = buffer;
    console.log('Generated default hitsound - 880Hz, 150ms');
};
Standard.prototype = Object.create(Beatmap.prototype, {
    approachTime: {
        get: function()
        {
            return this.ApproachRate < 5
                ? 1800 - this.ApproachRate * 120
                : 1200 - (this.ApproachRate - 5) * 150;
        }
    },
    // https://github.com/itdelatrisu/opsu/commit/8892973d98e04ebaa6656fe2a23749e61a122705
    circleDiameter: {
        get: function()
        {
            return 108.848 - this.CircleSize * 8.9646;
        }
    },
    stackOffset: {
        get: function()
        {
            return this.circleDiameter / 20;
        }
    }
});
Standard.prototype.constructor = Standard;
Standard.prototype.hitObjectTypes = {};
Standard.ID = 0;
Beatmap.modes[Standard.ID] = Standard;
Standard.DEFAULT_COLORS = [
    'rgb(0,202,0)',
    'rgb(18,124,255)',
    'rgb(242,24,57)',
    'rgb(255,292,0)'
];
Standard.STACK_LENIENCE = 3;
Standard.prototype.update = function(ctx)
{
    ctx.shadowColor = '#666';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    try
    {
        // this code will fail in Firefox(<~ 44)
        // https://bugzilla.mozilla.org/show_bug.cgi?id=941146
        ctx.font = this.circleRadius + 'px "Comic Sans MS", cursive, sans-serif';
    }
    catch (e) {}
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate((Beatmap.WIDTH - Beatmap.MAX_X) / 2, (Beatmap.HEIGHT - Beatmap.MAX_Y) / 2);
};
Standard.prototype.draw = function(time, ctx)
{
    if (typeof this.tmp.first == 'undefined')
    {
        this.tmp.first = 0;
        this.tmp.last = -1;
    }

    while (this.tmp.first < this.HitObjects.length)
    {
        var hitObject = this.HitObjects[this.tmp.first];
        if (time <= hitObject.endTime + hitObject.__proto__.constructor.FADE_OUT_TIME)
        {
            break;
        }
        this.tmp.first++;
    }
    while (this.tmp.last + 1 < this.HitObjects.length &&
        time >= this.HitObjects[this.tmp.last + 1].time - this.approachTime)
    {
        this.tmp.last++;
    }
    for (var i = this.tmp.last; i >= this.tmp.first; i--)
    {
        var hitObject = this.HitObjects[i];
        if (time > hitObject.endTime + hitObject.__proto__.constructor.FADE_OUT_TIME)
        {
            continue;
        }

        // Play hitsound when hit object becomes active
        if (time >= hitObject.time && !this.playedHitsounds.has(hitObject.time + '_' + i)) {
            this.playHitsound(hitObject);
            this.playedHitsounds.add(hitObject.time + '_' + i);
        }

        hitObject.draw(time, ctx);
    }
};
Standard.prototype.playHitsound = function(hitObject) {
    if (!this.audioContext || !this.hitsoundBuffers['normal-hitnormal']) {
        console.warn('Cannot play hitsound - audioContext or buffer missing');
        return;
    }

    try {
        // For now, play the normal hit sound for all hit objects
        const buffer = this.hitsoundBuffers['normal-hitnormal'];
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        // Add gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 1.0; // 100% volume - maximum
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start();
        
        console.log('Playing hitsound at time:', hitObject.time);
    } catch (e) {
        console.error('Error playing hitsound:', e);
    }
};
