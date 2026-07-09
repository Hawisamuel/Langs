<template>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <div>
        <h1>🔍 Forensic Evidence Logger</h1>
        <p class="subtitle">PKI-Powered Digital Forensics</p>
      </div>
      <div class="header-stats">
        <div class="stat">
          <span class="stat-value">{{ evidenceItems.length }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat">
          <span class="stat-value text-success">{{ verifiedCount }}</span>
          <span class="stat-label">Verified</span>
        </div>
        <div class="stat">
          <span class="stat-value text-danger">{{ tamperedCount }}</span>
          <span class="stat-label">Tampered</span>
        </div>
      </div>
    </header>
    
    <!-- Grid -->
    <div class="grid-2 mt-4">
      <!-- Left Column -->
      <div>
        <PKIStatus
          :is-initialized="isInitialized"
          :fingerprint="fingerprint"
          :public-key-exported="publicKeyExported"
          @initialize="handleInitialize"
          @reinitialize="handleReinitialize"
        />
        
        <div class="card mt-3">
          <h3>📥 Collect Evidence</h3>
          <div class="collect-form">
            <input
              v-model="newEvidenceDescription"
              placeholder="Evidence description..."
              class="input"
              @keyup.enter="handleCollect"
            />
            <textarea
              v-model="newEvidenceData"
              placeholder="Enter evidence data..."
              class="input textarea"
              rows="3"
            ></textarea>
            <button
              class="btn btn-primary"
              @click="handleCollect"
              :disabled="!isInitialized || isLoading"
            >
              {{ isLoading ? '⏳ Processing...' : '📥 Collect Evidence' }}
            </button>
          </div>
        </div>
        
        <EvidenceList
          :evidence-items="evidenceItems"
          :selected-evidence-id="selectedEvidenceId"
          :verified-count="verifiedCount"
          :tampered-count="tamperedCount"
          @select="selectEvidence"
        />
      </div>
      
      <!-- Right Column -->
      <div>
        <EvidenceDetail
          :evidence="selectedEvidence"
          @verify="handleVerify"
          @tamper="handleTamper"
          @add-custody="handleAddCustody"
          @generate-report="handleGenerateReport"
        />
        
        <ChainOfCustody :evidence="selectedEvidence" />
      </div>
    </div>
    
    <!-- Footer -->
    <footer class="footer">
      <p class="text-muted">
        🔐 All evidence is signed with RSA-PSS (2048-bit) | 
        PKI ensures integrity, authentication, and non-repudiation
      </p>
    </footer>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useForensics } from '../composables/useForensics'
import PKIStatus from './PKIStatus.vue'
import EvidenceList from './EvidenceList.vue'
import EvidenceDetail from './EvidenceDetail.vue'
import ChainOfCustody from './ChainOfCustody.vue'

export default {
  name: 'Dashboard',
  components: {
    PKIStatus,
    EvidenceList,
    EvidenceDetail,
    ChainOfCustody
  },
  setup() {
    const {
      isInitialized,
      isLoading,
      fingerprint,
      publicKeyExported,
      evidenceItems,
      selectedEvidenceId,
      verifiedCount,
      tamperedCount,
      selectedEvidence,
      initializePKI,
      collectEvidence,
      verifyEvidence,
      addCustodyEntry,
      simulateTampering,
      generateReport
    } = useForensics()
    
    const newEvidenceDescription = ref('')
    const newEvidenceData = ref('')
    
    // Auto-initialize on mount
    onMounted(() => {
      if (!isInitialized.value) {
        initializePKI()
      }
    })
    
    // Handlers
    const handleInitialize = () => {
      initializePKI()
    }
    
    const handleReinitialize = () => {
      if (confirm('Reinitializing will reset all evidence. Continue?')) {
        evidenceItems.value = []
        initializePKI()
      }
    }
    
    const handleCollect = async () => {
      if (!newEvidenceDescription.value || !newEvidenceData.value) {
        alert('Please provide both description and data')
        return
      }
      
      try {
        await collectEvidence(newEvidenceDescription.value, newEvidenceData.value)
        newEvidenceDescription.value = ''
        newEvidenceData.value = ''
      } catch (error) {
        alert('Failed to collect evidence: ' + error.message)
      }
    }
    
    const selectEvidence = (id) => {
      selectedEvidenceId.value = id
    }
    
    const handleVerify = async (id) => {
      try {
        await verifyEvidence(id)
      } catch (error) {
        alert('Verification failed: ' + error.message)
      }
    }
    
    const handleTamper = (id) => {
      if (confirm('Simulate tampering for this evidence?')) {
        simulateTampering(id)
      }
    }
    
    const handleAddCustody = () => {
      const handler = prompt('Enter handler name:')
      if (!handler) return
      
      const action = prompt('Enter action (collected/transferred/analyzed):') || 'transferred'
      const notes = prompt('Enter notes:') || ''
      
      addCustodyEntry(selectedEvidenceId.value, handler, action, notes)
    }
    
    const handleGenerateReport = () => {
      const report = generateReport(selectedEvidenceId.value)
      alert(report)
    }
    
    return {
      isInitialized,
      isLoading,
      fingerprint,
      publicKeyExported,
      evidenceItems,
      selectedEvidenceId,
      verifiedCount,
      tamperedCount,
      selectedEvidence,
      newEvidenceDescription,
      newEvidenceData,
      handleInitialize,
      handleReinitialize,
      handleCollect,
      selectEvidence,
      handleVerify,
      handleTamper,
      handleAddCustody,
      handleGenerateReport
    }
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

h1 {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #4a7cf7, #6a3cf7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #8888aa;
  font-size: 14px;
}

.header-stats {
  display: flex;
  gap: 30px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  color: #8888aa;
  text-transform: uppercase;
}

.collect-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px 15px;
  color: #e0e0e0;
  font-size: 14px;
  transition: all 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: #4a7cf7;
  box-shadow: 0 0 0 3px rgba(74, 124, 247, 0.2);
}

.input::placeholder {
  color: #666;
}

.textarea {
  resize: vertical;
  font-family: inherit;
}

.footer {
  margin-top: 40px;
  padding: 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
  font-size: 14px;
}
</style>
