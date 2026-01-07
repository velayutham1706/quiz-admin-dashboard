let quizzes = [];
let questions = [];
let answers = [];
let attempts = [];
let refreshCache = false;
let currentPage = 1;
let pageSize = 100;

let quizPage = 1;
let quizPageSize = 10;
let quizTotalRecords = 0;
let quizSorting = [{ fldname: "q_id", sort_order: "asc" }];

let answersPage = 1;
let answersPageSize = 10;
let answersTotalRecords = 0;
let answersSorting = [{ fldname: "q_id", sort_order: "asc" }];

let attemptsPage = 1;
let attemptsPageSize = 10;
let attemptsTotalRecords = 0;
let attemptsSorting = [{ fldname: 'attempt_date', sort_order: 'asc' }];

let allQuizzes = [];
let allAnswers = [];
let allAttempts = [];

function initDashboard() {
  loadAllData();
}

function loadAllData() {
  document.getElementById('loadingOverlay').classList.remove('hide');

  let completedCalls = 0;
  const totalCalls = 6;

  const checkAllLoaded = () => {
    completedCalls++;
    if (completedCalls >= totalCalls) {
      setTimeout(() => {
        document.getElementById('loadingOverlay').classList.add('hide');

        if (document.getElementById('dashboard-page').classList.contains('active')) {
          document.querySelectorAll('#dashboard-page h2').forEach(el => {
            animateNumber(el, Number(el.dataset.value || 0));
          });
        }
      }, 300);
    }
  };

  loadQuizStats(checkAllLoaded);
  loadQuizzes(checkAllLoaded);
  loadQuestions(checkAllLoaded);
  loadAnswers(checkAllLoaded);
  loadAttempts(checkAllLoaded);
  loadRecentActivity(checkAllLoaded);
}

function animateNumber(el, endValue, duration = 1000) {
  if (!el || el.dataset.animated === "true") return;

  el.dataset.animated = "true";

  let startTime = performance.now();

  function update(time) {
    const progress = Math.min((time - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * endValue).toLocaleString();

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function loadQuizStats(onComplete) {
  const params = {
    adsNames: ["quiz_stats_ads"],
    refreshCache: refreshCache,
    sqlParams: {},
    keyField: "username",
    keyValue: "ALL",
    props: {
      ADS: true,
      CachePermissions: true,
      getallrecordscount: true,
      pageno: 1,
      pagesize: 1,
      keyfield: "",
      keyvalue: "",
      sorting: [],
      filters: []
    }
  };

  try {
    GetDataFromAxList(
      params,
      function success(response) {
        try {
          let parsed = JSON.parse(response);

          let stats = {};
          if (parsed.result && parsed.result.data && parsed.result.data[0] && parsed.result.data[0].data && parsed.result.data[0].data[0]) {
            stats = parsed.result.data[0].data[0];
          }

          const tquizzes = document.getElementById('totalQuizzes');
          const tusers = document.getElementById('totalUsers');
          const tattempts = document.getElementById('totalAttempts');

          tquizzes.dataset.value = stats.total_quizzes || 0;
          tusers.dataset.value = stats.total_users || 0;
          tattempts.dataset.value = stats.total_attempts || 0;

          tquizzes.textContent = 0;
          tusers.textContent = 0;
          tattempts.textContent = 0;

          refreshCache = false;
        } catch (parseError) {
          console.error("Error parsing stats response:", parseError);

          document.getElementById('totalQuizzes').textContent = 0;
          document.getElementById('totalUsers').textContent = 0;
          document.getElementById('totalAttempts').textContent = 0;
        }
        if (onComplete) onComplete();
      },
      function error(err) {
        console.error("Error loading stats:", err);
        document.getElementById('totalQuizzes').textContent = 0;
        document.getElementById('totalUsers').textContent = 0;
        document.getElementById('totalAttempts').textContent = 0;
        if (onComplete) onComplete();
      }
    );
  } catch (ex) {
    console.error("Exception loading stats:", ex);
    document.getElementById('totalQuizzes').textContent = 0;
    document.getElementById('totalUsers').textContent = 0;
    document.getElementById('totalAttempts').textContent = 0;
  }
}

function loadQuizzes(onComplete) {
  const params = {
    adsNames: ["quiz_list_ads"],
    refreshCache: refreshCache,
    sqlParams: {},
    keyField: "",
    keyValue: "",
    props: {
      ADS: true,
      CachePermissions: true,
      getallrecordscount: true,
      pageno: 1,
      pagesize: 1000,
      keyfield: "",
      keyvalue: "",
      sorting: quizSorting,
      filters: []
    }
  };

  try {
    GetDataFromAxList(
      params,
      function success(response) {
        let parsed = JSON.parse(response);
        allQuizzes = parsed.result.data[0].data || [];
        quizzes = allQuizzes;

        quizTotalRecords = allQuizzes.length;

        updateQuizPagination();

        renderQuizPerformance();
        refreshCache = false;

        if (onComplete) {
          renderQuickStats();
        }

        if (onComplete) onComplete();
      },
      function error(err) {
        console.error("Error loading quizzes:", err);
        refreshCache = false;
        if (onComplete) onComplete();
      }
    );
  } catch (ex) {
    console.error("Exception loading quizzes:", ex);
    refreshCache = false;
  }
}

function updateQuizPagination() {
  const start = (quizPage - 1) * quizPageSize;
  const end = start + quizPageSize;
  quizzes = allQuizzes.slice(start, end);

  renderQuizTable();
  updatePaginationInfo(quizPage, quizPageSize, quizTotalRecords, 'quizPaginationInfo');
  updatePaginationButtons(quizPage, quizPageSize, quizTotalRecords, 'quiz');
}

function renderQuizTable() {
  const quizTableBody = document.getElementById('quizTableBody');
  quizTableBody.innerHTML = '';

  if (quizzes.length === 0) {
    quizTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No quizzes found</td></tr>';
    return;
  }

  quizzes.forEach(quiz => {
    const row = document.createElement('tr');

    const quizRecordId = quiz.quizt1id || '';
    const quizId = quiz.q_id || '';
    const quizTitle = quiz.q_title || 'Untitled';
    const totalQuestions = quiz.total_questions || 0;
    const totalAttempts = quiz.total_attempts || 0;
    const lastDate = quiz.last_date || '-';
    const difficulty = quiz.difficulty || 'Medium';

    row.innerHTML = `
        <td>${quizId}</td>
        <td class="font-semibold">${quizTitle}</td>
        <td>${totalQuestions}</td>
        <td>${totalAttempts}</td>
        <td>${formatDate(lastDate)}</td>
        <td><span class="difficulty-badge ${difficulty.toLowerCase()}">${difficulty}</span></td>
        <td>
            <button class="icon-btn" title="Edit" onclick="handleOpenTstructButton(event, this)" data-eot="recordid=${quizRecordId},transid=quizt">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            </button>
        </td>
        `;
    quizTableBody.appendChild(row);
  });
}

function loadQuestions(onComplete) {
  const params = {
    adsNames: ["quiz_details"],
    refreshCache: refreshCache,
    sqlParams: {},
    keyField: "username",
    keyValue: "ALL",
    props: {
      ADS: true,
      CachePermissions: true,
      getallrecordscount: true,
      pageno: currentPage,
      pagesize: pageSize,
      keyfield: "",
      keyvalue: "",
      sorting: [],
      filters: []
    }
  };

  try {
    GetDataFromAxList(
      params,
      function success(response) {
        let parsed = JSON.parse(response);
        questions = parsed.result.data[0].data || [];
        renderQuestionsGrid();
        refreshCache = false;

        if (onComplete) onComplete();
      },
      function error(err) {
        console.error("Error loading questions:", err);
        if (onComplete) onComplete();
      }
    );
  } catch (ex) {
    console.error("Exception loading questions:", ex);
  }
}

function renderQuestionsGrid() {
  const questionsGrid = document.getElementById('questionsGrid');
  questionsGrid.innerHTML = '';

  if (questions.length === 0) {
    questionsGrid.innerHTML = '<p style="text-align: center; padding: 2rem;">No questions found</p>';
    return;
  }

  questions.forEach(question => {
    const card = document.createElement('div');
    card.className = 'question-card';

    const quesRecordId = question.qmas1id || '';
    const quizTitle = question.q_title || 'Unknown Quiz';
    const questionText = question.question_text || 'Add here';
    const difficulty = question.difficulty || 'Medium';
    const totalQuestions = question.total_questions || 0;

    const hasNoQuestions = !questionText || questionText === 'Not Added' || totalQuestions === 0;

    card.innerHTML = `
      <div class="card-header">
        <span class="difficulty-badge ${difficulty.toLowerCase()}">${difficulty}</span>
        <div style="display: flex; gap: 0.5rem;">
          ${hasNoQuestions ? `
            <button class="icon-btn" onclick="handleAddQuestion(event, '${quizTitle.replace(/'/g, "\\'")}')" title="Add Question">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          ` : `
            <button class="icon-btn" onclick="handleOpenTstructButton(event, this)" data-eot="recordid=${quesRecordId},transid=qmas" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          `}
        </div>
      </div>
      <h3 class="card-title">${quizTitle}</h3>
      <div class="card-meta">
        <span>Questions: ${questionText}</span>
        <span>Total Questions: ${totalQuestions}</span>
      </div>
    `;
    questionsGrid.appendChild(card);
  });
}

function handleAddQuestion(event, quizTitle) {
  event.stopPropagation();
  const encodedQuizTitle = encodeURIComponent(quizTitle);
  const url = `tstruct.aspx?transid=qmas&act=open&quiz_title=${encodedQuizTitle}&AxPop=true`;
  const sizeClass = 'modal-lg';
  parent.createPopup(url, false, (e, popup) => {
    const modal = popup.modal?._element;
    const dialog = modal?.querySelector('.modal-dialog');
    if (dialog) {
      dialog.classList.remove('modal-sm', 'modal-lg', 'modal-xl');
      dialog.classList.add(sizeClass);
    }
  }, null);
}

function loadAnswers(onComplete) {
  const params = {
    adsNames: ["quiz_details"],
    refreshCache: refreshCache,
    sqlParams: {},
    keyField: "username",
    keyValue: "ALL",
    props: {
      ADS: true,
      CachePermissions: true,
      getallrecordscount: true,
      pageno: 1,
      pagesize: 1000,
      keyfield: "",
      keyvalue: "",
      sorting: answersSorting,
      filters: []
    }
  };

  try {
    GetDataFromAxList(
      params,
      function success(response) {
        let parsed = JSON.parse(response);
        allAnswers = parsed.result.data[0].data || [];
        answers = allAnswers;
        answersTotalRecords = allAnswers.length;
        updateAnswersPagination();
        refreshCache = false;
        if (onComplete) onComplete();
      },
      function error(err) {
        console.error("Error loading answers:", err);
        if (onComplete) onComplete();
      }
    );
  } catch (ex) {
    console.error("Exception loading answers:", ex);
  }
}

function updateAnswersPagination() {
  const start = (answersPage - 1) * answersPageSize;
  const end = start + answersPageSize;
  answers = allAnswers.slice(start, end);
  renderAnswersTable();
  updatePaginationInfo(answersPage, answersPageSize, answersTotalRecords, 'answersPaginationInfo');
  updatePaginationButtons(answersPage, answersPageSize, answersTotalRecords, 'answers');
}

function renderAnswersTable() {
  const answersTableBody = document.getElementById('answersTableBody');
  answersTableBody.innerHTML = '';

  if (answers.length === 0) {
    answersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No answers found</td></tr>';
    return;
  }

  answers.forEach(answer => {
    const row = document.createElement('tr');
    const ansRecordID = answer.opt1id || '';
    const qId = answer.q_id || '-';
    const quizTitle = answer.q_title || 'Unknown';
    const difficulty = answer.difficulty || 'Medium';
    const answersAdded = answer.answers_added || 'N';
    const questionId = answer.ques_id || '';
    const answerBadgeClass = answersAdded === 'Added' || answersAdded === ' Added ' ? 'correct' : 'incorrect';
    const answerText = answersAdded === 'Added' || answersAdded === ' Added ' ? 'Yes' : 'No';
    const hasNoAnswers = answersAdded === 'Not Added' || !answersAdded === 0;

    row.innerHTML = `
      <td>${qId}</td>
      <td class="font-semibold">${quizTitle}</td>
      <td><span class="difficulty-badge ${difficulty.toLowerCase()}">${difficulty}</span></td>
      <td><span class="correct-badge ${answerBadgeClass}">${answerText}</span></td>
      <td>${questionId}</td>
      <td>
      <div style="display: flex; gap:0.5rem;">
        ${hasNoAnswers ? `
          <button class="icon-btn" onclick="handleAddAnswer(event, '${quizTitle.replace(/'/g, "\\'")}')" title="Add">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          ` : `
          <button class="icon-btn" title="Edit" onclick="handleOpenTstructButton(event, this)" data-eot="recordid=${ansRecordID},transid=opt">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          `}
      </div>
      </td>
    `;
    answersTableBody.appendChild(row);
  });
}

function handleAddAnswer(event, quizTitle) {
  event.stopPropagation();
  const encodedQuizTitle = encodeURIComponent(quizTitle);
  const url = `tstruct.aspx?transid=opt&act=open&quiz_title=${encodedQuizTitle}&AxPop=true`;
  const sizeClass = 'modal-lg';
  parent.createPopup(url, false, (e, popup) => {
    const modal = popup.modal?._element;
    const dialog = modal?.querySelector('.modal-dialog');
    if (dialog) {
      dialog.classList.remove('modal-sm', 'modal-lg', 'modal-xl');
      dialog.classList.add(sizeClass);
    }
  }, null);
}

function loadAttempts(onComplete) {
  const params = {
    adsNames: ["quiz_attempts_ads"],
    refreshCache: refreshCache,
    sqlParams: {},
    keyField: "username",
    keyValue: "ALL",
    props: {
      ADS: true,
      CachePermissions: true,
      getallrecordscount: true,
      pageno: 1,
      pagesize: 1000,
      keyfield: "",
      keyvalue: "",
      sorting: attemptsSorting,
      filters: []
    }
  };

  try {
    GetDataFromAxList(
      params,
      function success(response) {
        let parsed = JSON.parse(response);
        allAttempts = parsed.result.data[0].data || [];
        attempts = allAttempts;
        attemptsTotalRecords = allAttempts.length;
        updateAttemptsPagination();
        refreshCache = false;
        if (onComplete) onComplete();
      },
      function error(err) {
        console.error("Error loading attempts:", err);
        refreshCache = false;
        if (onComplete) onComplete();
      }
    );
  } catch (ex) {
    console.error("Exception loading attempts:", ex);
    refreshCache = false;
  }
}

function updateAttemptsPagination() {
  const start = (attemptsPage - 1) * attemptsPageSize;
  const end = start + attemptsPageSize;
  attempts = allAttempts.slice(start, end);
  renderAttemptsTable();
  updatePaginationInfo(attemptsPage, attemptsPageSize, attemptsTotalRecords, 'attemptsPaginationInfo');
  updatePaginationButtons(attemptsPage, attemptsPageSize, attemptsTotalRecords, 'attempts');
}

function renderAttemptsTable() {
  const attemptsTableBody = document.getElementById('attemptsTableBody');
  attemptsTableBody.innerHTML = '';

  if (attempts.length === 0) {
    attemptsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No attempts found</td></tr>';
    return;
  }

  attempts.forEach(attempt => {
    const row = document.createElement('tr');
    const userId = attempt.username || 'Unknown';
    const userName = attempt.user_name || '-';
    const quizTitle = attempt.q_title || 'Unknown Quiz';
    const score = attempt.total_points || 0;
    const totalQuestions = attempt.total_questions || 10;
    const percentage = attempt.percentage || calculatePercentage(score, totalQuestions);
    const attemptDate = attempt.attempt_date || '-';

    let scoreClass = '';
    const percentNum = parseInt(percentage);
    if (percentNum >= 80) scoreClass = 'high';
    else if (percentNum >= 60) scoreClass = 'medium';
    else scoreClass = 'low';

    row.innerHTML = `
      <td class="font-semibold">${userId}</td>
      <td>${userName}</td>
      <td>${quizTitle}</td>
      <td><span class="score-badge ${scoreClass}">${score}</span></td>
      <td>${totalQuestions}</td>
      <td><span class="score-badge ${scoreClass}">${percentage}%</span></td>
      <td>${formatDate(attemptDate)}</td>
    `;
    attemptsTableBody.appendChild(row);
  });
}

function loadRecentActivity(onComplete) {
  const params = {
    adsNames: ["recent_activity_ads"],
    refreshCache: refreshCache,
    sqlParams: {},
    keyField: "username",
    keyValue: "ALL",
    props: {
      ADS: true,
      CachePermissions: true,
      getallrecordscount: true,
      pageno: 1,
      pagesize: 5,
      keyfield: "",
      keyvalue: "",
      sorting: [],
      filters: []
    }
  };

  try {
    GetDataFromAxList(
      params,
      function success(response) {
        let parsed = JSON.parse(response);
        let activities = parsed.result.data[0].data || [];
        renderRecentActivity(activities);
        renderRecentResults(activities);
        refreshCache = false;
        if (onComplete) onComplete();
      },
      function error(err) {
        console.error("Error loading activity:", err);
        if (onComplete) onComplete();
      }
    );
  } catch (ex) {
    console.error("Exception loading activity:", ex);
  }
}

function renderRecentActivity(activities) {
  const activityList = document.getElementById('activityList');
  activityList.innerHTML = '';

  activities.slice(0, 3).forEach(activity => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    const user = activity.user_name || 'User';
    const quiz = activity.q_title || 'Quiz';
    const score = activity.percentage || 0;
    const scoreNum = parseInt(score);
    let statusClass = 'pass';
    if (scoreNum < 40) statusClass = 'fail';

    item.innerHTML = `
      <div class="activity-info">
        <span class="activity-user">${user}</span>
        <span class="activity-detail">completed ${quiz}</span>
      </div>
      <span class="activity-badge ${statusClass}">${score}%</span>
    `;
    activityList.appendChild(item);
  });
}

function renderQuickStats() {
  const quickStats = document.getElementById('quickStats');
  quickStats.innerHTML = '';

  allQuizzes.slice(0, 3).forEach(quiz => {
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.innerHTML = `
    <div class="chart-label">${quiz.q_title}</div>
    <div class="chart-bar-bg">
      <div class="chart-bar-fill" style="width: ${quiz.avg_percentage}%">
        <span class="chart-value">${quiz.avg_percentage}%</span>
      </div>
    </div>
    `;
    quickStats.appendChild(bar);
  });
}

function renderQuizPerformance() {
  const quizPerformance = document.getElementById('quizPerformance');
  quizPerformance.innerHTML = '';

  if (allQuizzes.length === 0) return;

  allQuizzes.slice(0, 6).forEach(quiz => {
    const item = document.createElement('div');
    item.className = 'bar-chart-item';
    const quizTitle = quiz.quiz_title || quiz.q_title || 'Quiz';
    const attempts = quiz.total_attempts || 0;
    const maxAttempts = Math.max(...allQuizzes.map(q => q.total_attempts || 0), 1);

    item.innerHTML = `
      <div class="bar-label">${quizTitle}</div>
      <div class="bar-wrapper">
        <div class="bar-fill" style="width: ${(attempts / maxAttempts) * 100}%">
          <span class="bar-value">${attempts}</span>
        </div>
      </div>
    `;
    quizPerformance.appendChild(item);
  });
}

function renderRecentResults(activities) {
  const recentResults = document.getElementById('recentResults');
  recentResults.innerHTML = '';

  activities.slice(0, 4).forEach(activity => {
    const item = document.createElement('div');
    item.className = 'result-item';
    const user = activity.user_name || 'User';
    const quiz = activity.q_title || 'Quiz';
    const score = activity.percentage || 0;
    const scoreNum = parseInt(score);
    let statusClass = 'pass';
    if (scoreNum < 40) statusClass = 'fail';

    item.innerHTML = `
      <div class="result-info">
        <span class="result-user">${user}</span>
        <span class="result-quiz">${quiz}</span>
      </div>
      <span class="result-badge ${statusClass}">${score}%</span>
    `;
    recentResults.appendChild(item);
  });
}

function updatePaginationInfo(page, pageSize, totalRecords, infoElementId) {
  const start = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRecords);
  document.getElementById(infoElementId).textContent = `Showing ${start}-${end} of ${totalRecords}`;
}

function updatePaginationButtons(page, pageSize, totalRecords, prefix) {
  const totalPages = Math.ceil(totalRecords / pageSize);
  document.getElementById(`${prefix}FirstPage`).disabled = page === 1;
  document.getElementById(`${prefix}PrevPage`).disabled = page === 1;
  document.getElementById(`${prefix}NextPage`).disabled = page >= totalPages;
  document.getElementById(`${prefix}LastPage`).disabled = page >= totalPages;
  document.getElementById(`${prefix}CurrentPage`).textContent = `Page ${page} of ${totalPages}`;
}

function setupPagination(prefix, updateFunction) {
  const getVars = () => {
    switch (prefix) {
      case 'quiz':
        return {
          page: quizPage,
          pageSize: quizPageSize,
          total: quizTotalRecords,
          setPage: (v) => { quizPage = v; },
          setPageSize: (v) => { quizPageSize = v; }
        };
      case 'answers':
        return {
          page: answersPage,
          pageSize: answersPageSize,
          total: answersTotalRecords,
          setPage: (v) => { answersPage = v; },
          setPageSize: (v) => { answersPageSize = v; }
        };
      case 'attempts':
        return {
          page: attemptsPage,
          pageSize: attemptsPageSize,
          total: attemptsTotalRecords,
          setPage: (v) => { attemptsPage = v; },
          setPageSize: (v) => { attemptsPageSize = v; }
        };
    }
  };

  document.getElementById(`${prefix}FirstPage`)?.addEventListener('click', () => {
    const vars = getVars();
    vars.setPage(1);
    updateFunction();
  });

  document.getElementById(`${prefix}PrevPage`)?.addEventListener('click', () => {
    const vars = getVars();
    if (vars.page > 1) {
      vars.setPage(vars.page - 1);
      updateFunction();
    }
  });

  document.getElementById(`${prefix}NextPage`)?.addEventListener('click', () => {
    const vars = getVars();
    const totalPages = Math.ceil(vars.total / vars.pageSize);
    if (vars.page < totalPages) {
      vars.setPage(vars.page + 1);
      updateFunction();
    }
  });

  document.getElementById(`${prefix}LastPage`)?.addEventListener('click', () => {
    const vars = getVars();
    const totalPages = Math.ceil(vars.total / vars.pageSize);
    vars.setPage(totalPages);
    updateFunction();
  });

  document.getElementById(`${prefix}PageSize`)?.addEventListener('change', (e) => {
    const vars = getVars();
    vars.setPageSize(parseInt(e.target.value));
    vars.setPage(1);
    updateFunction();
  });
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === '-') return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}

function calculatePercentage(score, total) {
  if (!total || total === 0) return "0%";
  return `${Math.round((score / total) * 100)}%`;
}

function handleOpenTstructButton(e, btn) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (btn) {
    const eot = btn.getAttribute('data-eot');
    let recordid = "";
    let transid = "";
    const parts = eot.split(",");
    var url = "";

    parts.forEach(part => {
      const [key, value] = part.trim().split("=");
      if (key === "recordid") {
        recordid = value;
      }
      if (key === "transid") {
        transid = value;
      }
    });

    if (transid) {
      if (recordid && recordid !== "" && recordid !== "0") {
        url = `tstruct.aspx?transid=${encodeURIComponent(transid)}&recordid=${recordid}&act=open&dummyload=false`;
      } else {
        url = `tstruct.aspx?transid=${encodeURIComponent(transid)}&act=open&dummyload=false`;
      }
    }
  }

  const sizeClass = 'modal-lg';
  parent.createPopup(url, false, (e, popup) => {
    const modal = popup.modal?._element;
    const dialog = modal?.querySelector('.modal-dialog');
    if (dialog) {
      dialog.classList.remove('modal-sm', 'modal-lg', 'modal-xl');
      dialog.classList.add(sizeClass);
    }
  }, null);
}

function handleOpenIviewButton(e, btn) {
  if (btn) {
    const eot = btn.getAttribute('data-eot');
    let recordid = "";
    let transid = "";
    const parts = eot.split(",");
    var url = "";

    parts.forEach(part => {
      const [key, value] = part.trim().split("=");
      if (key === "recordid") {
        recordid = value;
      }
      if (key === "transid") {
        transid = value;
      }
    });

    if (transid || recordid === "") {
      url = `iview.aspx ? ivname = ${encodeURIComponent(transid)}& recordid=${recordid}& act=open & dummyload=false`;
    }

    const sizeClass = 'modal-lg';
    parent.createPopup(url, false, (e, popup) => {
      const dialog = popup.modal?._element?.querySelector('.modal-dialog');
      if (dialog) {
        dialog.classList.remove('modal-sm', 'modal-lg', 'modal-xl');
        dialog.classList.add(sizeClass);
      }
    }, null);
  }
}

function setupSorting() {
  document.querySelectorAll("#quiz-page .data-table thead th.sortable").forEach(th => {
    th.addEventListener("click", function() {
      const field = this.getAttribute("data-field");
      const currentOrder = this.classList.contains("asc") ? "asc" : this.classList.contains("desc") ? "desc" : null;
      let newOrder = "asc";

      if (currentOrder === "asc") {
        newOrder = "desc";
      } else if (currentOrder === "desc") {
        newOrder = null;
      }

      document.querySelectorAll("#quiz-page .data-table thead th.sortable").forEach(th2 => {
        th2.classList.remove("asc", "desc", "active");
      });

      if (newOrder) {
        this.classList.add(newOrder, "active");

        allQuizzes.sort((a, b) => {
          let aVal = a[field];
          let bVal = b[field];

          if (!isNaN(aVal) && !isNaN(bVal)) {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
            return newOrder === "asc" ? aVal - bVal : bVal - aVal;
          }

          aVal = String(aVal || "").toLowerCase();
          bVal = String(bVal || "").toLowerCase();

          if (newOrder === "asc") {
            return aVal.localeCompare(bVal);
          } else {
            return bVal.localeCompare(aVal);
          }
        });
      } else {
        loadQuizzes(() => { });
      }

      quizPage = 1;
      updateQuizPagination();
    });
  });

  document.querySelectorAll("#answers-page .data-table thead th.sortable").forEach(th => {
    th.addEventListener("click", function() {
      const field = this.getAttribute("data-field");
      const currentOrder = this.classList.contains("asc") ? "asc" : this.classList.contains("desc") ? "desc" : null;
      let newOrder = "asc";

      if (currentOrder === "asc") {
        newOrder = "desc";
      } else if (currentOrder === "desc") {
        newOrder = null;
      }

      document.querySelectorAll("#answers-page .data-table thead th.sortable").forEach(th2 => {
        th2.classList.remove("asc", "desc", "active");
      });

      if (newOrder) {
        this.classList.add(newOrder, "active");

        allAnswers.sort((a, b) => {
          let aVal = a[field];
          let bVal = b[field];

          if (!isNaN(aVal) && !isNaN(bVal)) {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
            return newOrder === "asc" ? aVal - bVal : bVal - aVal;
          }

          aVal = String(aVal || "").toLowerCase();
          bVal = String(bVal || "").toLowerCase();

          if (newOrder === "asc") {
            return aVal.localeCompare(bVal);
          } else {
            return bVal.localeCompare(aVal);
          }
        });
      } else {
        loadAnswers(() => { });
      }

      answersPage = 1;
      updateAnswersPagination();
    });
  });

  document.querySelectorAll("#attempt-page .data-table thead th.sortable").forEach(th => {
    th.addEventListener("click", function() {
      const field = this.getAttribute("data-field");
      const currentOrder = this.classList.contains("asc") ? "asc" : this.classList.contains("desc") ? "desc" : null;
      let newOrder = "asc";

      if (currentOrder === "asc") {
        newOrder = "desc";
      } else if (currentOrder === "desc") {
        newOrder = null;
      }

      document.querySelectorAll("#attempt-page .data-table thead th.sortable").forEach(th2 => {
        th2.classList.remove("asc", "desc", "active");
      });

      if (newOrder) {
        this.classList.add(newOrder, "active");

        allAttempts.sort((a, b) => {
          let aVal = a[field];
          let bVal = b[field];

          if (!isNaN(aVal) && !isNaN(bVal)) {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
            return newOrder === "asc" ? aVal - bVal : bVal - aVal;
          }

          aVal = String(aVal || "").toLowerCase();
          bVal = String(bVal || "").toLowerCase();

          if (newOrder === "asc") {
            return aVal.localeCompare(bVal);
          } else {
            return bVal.localeCompare(aVal);
          }
        });
      } else {
        loadAttempts(() => { });
      }

      attemptsPage = 1;
      updateAttemptsPagination();
    });
  });
}

const menuItems = document.querySelectorAll('.menu-item[data-page]');
const pages = document.querySelectorAll('.page-content');

menuItems.forEach(item => {
  item.addEventListener('click', () => {
    const pageName = item.getAttribute('data-page');
    menuItems.forEach(mi => mi.classList.remove('active'));
    item.classList.add('active');
    pages.forEach(page => page.classList.remove('active'));
    const selectedPage = document.getElementById(`${pageName} -page`);
    if (selectedPage) {
      selectedPage.classList.add('active');
      if (pageName === 'dashboard') {
        animateNumber(document.getElementById('totalQuizzes'), Number(document.getElementById('totalQuizzes').dataset.value || 0));
        animateNumber(document.getElementById('totalUsers'), Number(document.getElementById('totalUsers').dataset.value || 0));
        animateNumber(document.getElementById('totalAttempts'), Number(document.getElementById('totalAttempts').dataset.value || 0));
      }
    }
  });
});

const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const activePage = document.querySelector('.page-content.active');

  if (!query) {
    activePage.querySelectorAll('tr, .question-card, .activity-item, .result-item').forEach(item => {
      item.style.display = '';
    });
    return;
  }

  activePage.querySelectorAll('tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  });

  activePage.querySelectorAll('.question-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(query) ? '' : 'none';
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
    e.preventDefault();
    searchInput.focus();
  }
  if (e.key === 'Escape' && document.activeElement === searchInput) {
    searchInput.value = '';
    searchInput.blur();
    searchInput.dispatchEvent(new Event('input'));
  }
});

const collapseBtn = document.getElementById('collapseBtn');
const sidebar = document.getElementById('sidebar');
let isCollapsed = false;

function initSettings() {
  const darkMode = JSON.parse(localStorage.getItem('darkMode')) || false;
  const sidebarVisible = JSON.parse(localStorage.getItem('sidebarVisible')) !== false;
  const autoRefresh = JSON.parse(localStorage.getItem('autoRefresh')) || false;
  const defaultPageSize = localStorage.getItem('defaultPageSize') || '10';

  if (darkMode) {
    document.body.classList.add('dark-mode');
    const darkToggle = document.getElementById('darkModeToggle');
    if (darkToggle) darkToggle.classList.add('active');
  }

  if (!sidebarVisible) {
    sidebar.classList.add('collapsed');
    isCollapsed = true;
    collapseBtn.style.transform = 'rotate(180deg)';
  }

  if (autoRefresh) {
    const autoRefreshToggle = document.getElementById('autoRefreshToggle');
    if (autoRefreshToggle) autoRefreshToggle.classList.add('active');
    startAutoRefresh();
  }

  const pageSizeSelect = document.getElementById('defaultPageSize');
  if (pageSizeSelect) {
    pageSizeSelect.value = defaultPageSize;
    document.querySelectorAll('.page-size-select').forEach(select => {
      if (select.id !== 'defaultPageSize') {
        select.value = defaultPageSize;
      }
    });
    quizPageSize = parseInt(defaultPageSize);
    answersPageSize = parseInt(defaultPageSize);
    attemptsPageSize = parseInt(defaultPageSize);
  }

  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', this.classList.contains('active'));
    });
  }

  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle && sidebarVisible) {
    sidebarToggle.classList.add('active');
  }
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      const isVisible = this.classList.contains('active');
      localStorage.setItem('sidebarVisible', isVisible);

      if (isVisible) {
        sidebar.classList.remove('collapsed');
        isCollapsed = false;
        collapseBtn.style.transform = 'rotate(0deg)';
      } else {
        sidebar.classList.add('collapsed');
        isCollapsed = true;
        collapseBtn.style.transform = 'rotate(180deg)';
      }
    });
  }

  const autoRefreshToggle = document.getElementById('autoRefreshToggle');
  if (autoRefreshToggle) {
    autoRefreshToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      const isActive = this.classList.contains('active');
      localStorage.setItem('autoRefresh', isActive);

      if (isActive) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    });
  }

  if (pageSizeSelect) {
    pageSizeSelect.addEventListener('change', function() {
      const newSize = this.value;
      localStorage.setItem('defaultPageSize', newSize);

      quizPageSize = parseInt(newSize);
      answersPageSize = parseInt(newSize);
      attemptsPageSize = parseInt(newSize);

      document.getElementById('quizPageSize').value = newSize;
      document.getElementById('answersPageSize').value = newSize;
      document.getElementById('attemptsPageSize').value = newSize;

      quizPage = 1;
      answersPage = 1;
      attemptsPage = 1;

      updateQuizPagination();
      updateAnswersPagination();
      updateAttemptsPagination();
    });
  }

  const clearCacheBtn = document.getElementById('clearCacheBtn');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all cached data? This will reload the page.')) {
        refreshCache = true;
        loadAllData();
      }
    });
  }
}

let autoRefreshInterval = null;

function startAutoRefresh() {
  if (autoRefreshInterval) return;

  autoRefreshInterval = setInterval(() => {
    refreshCache = true;
    loadAllData();
  }, 5 * 60 * 1000);
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

collapseBtn.addEventListener('click', () => {
  isCollapsed = !isCollapsed;
  sidebar.classList.toggle('collapsed');
  collapseBtn.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
  localStorage.setItem('sidebarVisible', !isCollapsed);
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    if (isCollapsed) {
      sidebarToggle.classList.remove('active');
    } else {
      sidebarToggle.classList.add('active');
    }
  }
});

document.getElementById('refreshBtn').addEventListener('click', () => {
  location.reload();
});

window.refreshQuizData = function() {
  refreshCache = true;
  loadAllData();
};

window.handleOpenTstructButton = handleOpenTstructButton;
window.handleOpenIviewButton = handleOpenIviewButton;

initSettings();
initDashboard();

setupPagination('quiz', updateQuizPagination);
setupPagination('answers', updateAnswersPagination);
setupPagination('attempts', updateAttemptsPagination);
setupSorting();
