<template>
  <div>
    <Tower :settings="settings" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'IndexPage',
  data() {
    return {
      settings: []
    }
  },
  async mounted() {
    try {
      const response = await this.$axios.get('settings');
      this.settings = response.data.data;
    } catch (err) {
      console.error(err);
    }
  }
})
</script>
