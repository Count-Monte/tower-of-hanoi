<template>
  <div>
    <Tower :settings="$store.state.settings.list" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'IndexPage',
  data() {
    return {
    }
  },
  async mounted () {
    try {
      const settingsResponse = await this.$axios.get('settings');
      this.$store.commit('settings/set', settingsResponse.data.data);
    } catch (error) {
      console.error(error);
    }
  }
})
</script>
