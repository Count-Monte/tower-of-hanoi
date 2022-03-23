<template>
    <div>
        <!--
            we need to track mouse movements in the container when trying to move disks
            might as well track touch movements here, too
        -->
        <div class="flex justify-between items-center mx-8 mt-8">
            <div class='text-gray-800 text-xl font-bold'>
                {{remainingTimeString}} Remaining
            </div>
        </div>

        <div v-if="endTime > currentTime" class="flex justify-between items-center mx-8 mt-8" @mousemove="moveDisk" @touchmove="moveDisk">
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
                    :width="dragging && dragging.diskNumber === diskNumber ? dragging.width : disks[diskNumber].width"
                    :height="dragging && dragging.diskNumber === diskNumber ? dragging.height : disks[diskNumber].height"
                    @mousedown.native="(event) => pickupDisk(event, pegNumber, diskNumber)"
                    @touchstart.native="(event) => pickupDisk(event, pegNumber, diskNumber)"
                />

                <div style="position: relative; height: 100%; z-index: -20">
                    <div class="bg-yellow-700 opacity-50" style="position: absolute; top: 0; bottom: 0; left: calc(50% - 5px); right: calc(50% - 5px);"></div>
                </div>
            </div>
        </div>

        <div v-else-if="endTime" class="flex justify-between items-center mx-8 mt-8">
            <div class='text-gray-800 text-2xl font-bold mx-auto'>
                Game Finished!
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
import { solveHanoi, steps } from 'towers-of-hanoi';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
export default {
    components: { PreForm },
    props: ['settings'],
    data() {
        return {
            dragging: null,
            totalTime: 0,
            pegs: [],
            win: [],
            disks: {},
            moves: 0,
            minMoves: 0,
            done: false,
            correctMoves: 0,
            startTime: 0,
            endTime: 0,
            currentTime: 0,
            steps: [],
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
            this.startTime = moment();
            this.correctMoves = 0;
            this.steps = [];
            for (let move of solveHanoi(this.numDisks)) {
                this.steps.push(move);
            }
        },

        pickupDisk(event, pegNumber, diskNumber) {
            // only pickup if it's the top disk on the peg
            if (!this.dragging && !this.done && this.pegs[pegNumber].slice(-1)[0] === diskNumber) {
                // remember what we're dragging around - this is needed for when we drop the disk
                this.dragging = {
                    disk: event.target,
                    width: `${event.target.clientWidth}px`,
                    height: `${event.target.clientHeight}px`,
                    pegNumber,
                    diskNumber
                };

                // 'position: fixed' means we can freely position the disk anywhere in the page
                // event.target.style.height = event.target.clientHeight;
                // event.target.style.width = event.target.clientWidth;
                event.target.style.position = 'fixed';
                event.target.style.zIndex = '-10';

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
                    this.dragging.disk.style.left = `${event.clientX - this.dragging.disk.clientWidth / 2}px`;
                    this.dragging.disk.style.top = `${event.clientY -  this.dragging.disk.clientHeight / 2}px`;
                } else {
                    // touchmove is harder...
                    // multiple touch is supported, but so far we're only interested in one
                    // although, knowing that we can get information on multiple touch points is cool
                    // pinch zoom or rotation
                    this.dragging.disk.style.left = `${event.changedTouches[0].clientX - this.dragging.disk.clientWidth / 2}px`;
                    this.dragging.disk.style.top = `${event.changedTouches[0].clientY - this.dragging.disk.clientHeight / 2}px`;
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
            if (elem) {
                pegNumber = elem.dataset['peg'];

                if (this.dragging && pegNumber !== undefined) {
                    if (this.compareSteps(this.steps[0], this.dragging.pegNumber, pegNumber)) {
                        this.correctMoves ++;
                    } else if(this.steps.length > 1 && this.compareSteps(this.steps[1], this.dragging.pegNumber, pegNumber)) {
                        this.correctMoves ++;
                        this.steps.shift();
                    }
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
            }
        },

        compareSteps(step, from, to) {
            console.log({...step}, from, to);
            return step.from - 1 == from && step.to - 1 == to;
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
            this.userId = userId;
            this.endTime = moment().add('seconds', this.settings[1]?.attributes?.Value);
        },

        updateCurrentTime() {
            this.currentTime = moment();
        }
    },

    mounted() {
        this.reset();

        // after clicking/touching a disk to move, the user can try to 'drop' it anywhere
        // so we listen for this at the top most level
        document.addEventListener('mouseup', this.dropDisk);
        document.addEventListener('touchend', this.dropDisk);
        document.addEventListener('touchcancel', this.dropDisk);

        setInterval(this.updateCurrentTime, 1000);
    },

    computed: {
        numDisks() {
            return this.settings[0]?.attributes?.Value;
        },
        remainingTimeString() {
            const remainingSeconds = this.endTime && moment.duration(this.endTime.diff(this.currentTime)).asSeconds();
            return `${Math.floor(remainingSeconds / 60)}:${Math.floor(remainingSeconds % 60)}`;
        }
    },

    watch: {
        numDisks() {
            this.reset();
        },

        done(newValue, oldValue) {
            if (newValue) {
                console.log(this.userId);
                this.$axios.post('scores', {
                    data: {
                        NumberOfDisks: this.numDisks,
                        ElapsedTime: (moment.duration(moment().diff(this.startTime)).asSeconds()).toFixed(0),
                        TotalMoves: this.moves,
                        CorrectMoves: this.minMoves,
                        UserId: this.userId,
                        GameId: `Game_${uuidv4()}`
                    }
                })
            }
        }
    }
};
</script>
