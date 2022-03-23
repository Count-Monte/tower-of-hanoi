<template>
    <div>
        <div class="flex">
            <button class="flex-1 py-4 border border-blue-500" :class="{'bg-blue-100': numDisks === 3}" @click="() => { numDisks = 3; reset()}">3 disks</button>
            <button class="flex-1 py-4 border border-blue-500" :class="{'bg-blue-100': numDisks === 4}" @click="() => { numDisks = 4; reset()}">4 disks</button>
            <button class="flex-1 py-4 border border-blue-500" :class="{'bg-blue-100': numDisks === 5}" @click="() => { numDisks = 5; reset()}">5 disks</button>
            <button class="flex-1 py-4 border border-blue-500" :class="{'bg-blue-100': numDisks === 6}" @click="() => { numDisks = 6; reset()}">6 disks</button>
        </div>

        <!--
            we need to track mouse movements in the container when trying to move disks
            might as well track touch movements here, too
        -->
        <div class="flex justify-between items-center mx-8 mt-8" @mousemove="moveDisk" @touchmove="moveDisk">
            <div v-for="(peg, pegNumber) in pegs"
                 :key="pegNumber"
                 class="flex relative flex-col-reverse justify-start items-center"
                 style="width: 25%; height: 200px"
                 :data-peg="pegNumber"
                 @touchend="placeDisk"
                 @mouseup="placeDisk"
            >
                <div class="flex-none h-2 w-full bg-yellow-700 z-10"></div>

                <!--
                    setting 'touch-action: none' stops the browser scrolling around after we pickup a disk
                    once we've picked up the disk, scrolling will remain disked until we release it

                    we set it here, because we want to limit our interference with the user interface
                -->
                <Disk v-for="diskNumber in peg"
                      :key="diskNumber"
                      class="flex-none z-10"
                      style="touch-action: none"
                      :color="disks[diskNumber].color"
                      :width="disks[diskNumber].width"
                      :height="disks[diskNumber].height"
                      @mousedown.native="(event) => pickupDisk(event, pegNumber, diskNumber)"
                      @touchstart.native="(event) => pickupDisk(event, pegNumber, diskNumber)"
                />

                <div style="position: relative; height: 100%; z-index: -20">
                    <div class="bg-yellow-700 opacity-50" style="position: absolute; top: 0; bottom: 0; left: calc(50% - 5px); right: calc(50% - 5px);"></div>
                </div>
            </div>
        </div>

        <div class="lg:flex justify-between m-8 text-xl">
            <span>Moves taken: {{ moves }}/{{minMoves}}</span>
            <span v-if="done" class="ml-4">
                Well done, you've solved the puzzle,
                <span v-if="moves === minMoves">and managed this in the minimum number of moves. <a @click.prevent="reset" class="text-blue-700 visited:text-purple-700 hover:text-indigo-500 underline cursor-pointer">Play again?</a></span>
                <span v-if="moves > minMoves">but can you do it in less moves? <a @click.prevent="reset" class="text-blue-700 visited:text-purple-700 hover:text-indigo-500 underline cursor-pointer">Try again?</a></span>
            </span>
        </div>
        <PreForm :onIDApproved="handleIdApproved" />
    </div>
</template>

<script>
import PreForm from './PreForm.vue';
export default {
  components: { PreForm },
    data() {
        return {
            dragging: null,

            numDisks: 3,

            pegs: [],

            win: [],

            disks: {},

            moves: 0,
            minMoves: 0,

            done: false,
        }
    },

    methods: {
        reset() {
            this.pegs = [
                [],
                [],
                []
            ];

            this.disks = {};
            this.win = [];

            for (let i = 1; i <= this.numDisks; i++) {
                this.pegs[0].push(i);
                this.win.push(i);

                this.disks[i] = {
                    color: 'hsl(' + (360 * i / this.numDisks)  + ', 80%, 60%)',
                    width: (100 * (this.numDisks - i + 1) / this.numDisks) + '%',
                    height: 100 / (this.numDisks + 1) + '%',
                }
            }

            this.moves = 0;
            this.minMoves = Math.pow(2, this.numDisks) - 1;
            this.done = false;
        },

        pickupDisk(event, pegNumber, diskNumber) {
            // only pickup if it's the top disk on the peg
            if (!this.done && this.pegs[pegNumber].slice(-1)[0] === diskNumber) {
                // 'position: fixed' means we can freely position the disk anywhere in the page
                event.target.style.height = event.target.clientHeight;
                event.target.style.width = event.target.clientWidth;
                event.target.style.position = 'fixed';
                event.target.style.zIndex = '-10';

                // remember what we're dragging around - this is needed for when we drop the disk
                this.dragging = {
                    disk: event.target,
                    pegNumber,
                    diskNumber
                };

                // initialise the position of the disk
                // usually the user will start moving as soon as they pickup a disk (even if it's just a jiggle)
                // but sometimes they will delay, and if we don't set the left/top positions of the disk, it could start anywhere
                this.moveDisk(event);
            }
        },

        moveDisk(event) {
            if (this.dragging) {
                if (event.clientX) {
                    // mousemove is easy - there's only one pointer, so it's x/y is easily found
                    this.dragging.disk.style.left = event.clientX - this.dragging.disk.clientWidth / 2;
                    this.dragging.disk.style.top = event.clientY -  this.dragging.disk.clientHeight / 2;
                } else {
                    // touchmove is harder...
                    // multiple touch is supported, but so far we're only interested in one
                    // although, knowing that we can get information on multiple touch points is cool
                    // pinch zoom or rotation
                    this.dragging.disk.style.left = event.changedTouches[0].clientX - this.dragging.disk.clientWidth / 2;
                    this.dragging.disk.style.top = event.changedTouches[0].clientY - this.dragging.disk.clientHeight / 2;
                }
            }
        },

        placeDisk(event) {
            let elem = null;
            let pegNumber = null;

            if (event.clientX) {
                // mousedown
                elem = document.elementFromPoint(event.clientX, event.clientY);
            } else {
                // touchend
                elem = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
            }

            pegNumber = elem.dataset['peg'];

            if (this.dragging) {
                if (this.pegs[pegNumber].length === 0 || this.pegs[pegNumber].slice(-1).pop() < this.dragging.diskNumber) {
                    this.pegs[pegNumber].push(this.dragging.diskNumber);
                    this.pegs[this.dragging.pegNumber].pop();
                }

                if (this.dragging.disk.parentNode !== elem) {
                    this.moves++;
                }
            }

            this.done = this.win.every((test, index) =>  {
                return this.pegs[2][index] === test;
            });
        },

        dropDisk() {
            // reset everything
            if (this.dragging) {
                this.dragging.disk.style.position = '';
                this.dragging.disk.style.left = '';
                this.dragging.disk.style.top = '';
                this.dragging.disk.style.zIndex = '';

                this.dragging = null;
            }
        },

        handleIdApproved(adminId, userId) {
            console.log(adminId, userId);
        }
    },

    mounted() {
        this.reset();

        // after clicking/touching a disk to move, the user can try to 'drop' it anywhere
        // so we listen for this at the top most level
        console.log('abababab');
        document.addEventListener('mouseup', this.dropDisk);
        document.addEventListener('touchend', this.dropDisk);
        document.addEventListener('touchcancel', this.dropDisk);
    }
};
</script>