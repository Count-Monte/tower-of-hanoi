<template>
    <div :style="styleObject">

    </div>
</template>

<script>
export default {
    props: {
        block: Number,
        color: String,
        height: String,
        width: String,
        peg: Number
    },

    data() {
        return {

        }
    },

    computed: {
        styleObject() {
            return {
                'background-color': this.color,
                height: this.height,
                width: this.width,
            }
        }
    },

    methods: {

    }
};
</script>
